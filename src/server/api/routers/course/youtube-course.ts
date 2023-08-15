import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { generateStaticCourseOgImage } from "@/server/services/og";
import { getPlaylistDataService } from "@/server/services/youtube";
import { importCourseFormSchema } from "@/pages/course/import";
import { adminImportCourseFormSchema } from "@/pages/course/admin-import";
import { isAdmin } from "@/server/helpers/admin";
import { imageUploadFromBody } from "@/server/helpers/s3";
import { TRPCError } from "@trpc/server";
import { env } from "@/env.mjs";
import { sendClaimCourseRequest } from "@/server/helpers/emailHelper";

export const OG_URL = `${process.env.VERCEL ? "https://" : ""}${
  env.NEXTAUTH_URL
}/api/og/course`;

export const youtubeCourseRouter = createTRPCRouter({
  import: protectedProcedure
    .input(importCourseFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      if (!input) throw new TRPCError({ code: "BAD_REQUEST" });

      const existingCourse = await prisma.course.findFirst({
        where: { ytId: input.ytId },
      });

      if (existingCourse) throw new TRPCError({ code: "BAD_REQUEST" });

      const course = await prisma.course.create({
        data: {
          title: input.title,
          description: input.description,
          thumbnail: input.thumbnail,
          creatorId: ctx.session.user.id,
          ytId: input.ytId,
          price: parseInt(input.price),
          permanentDiscount: parseInt(input.permanentDiscount),
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { id: tag.id },
              create: { title: tag.title },
            })),
          },
          categoryId: input?.category?.id,
        },
      });

      const discount = input.discount
        ? await prisma.discount.create({
            data: {
              courseId: course.id,
              price: parseInt(input.discount.price),
              deadline: input.discount.deadline,
            },
          })
        : undefined;

      const chapters = await Promise.all(
        input.chapters.map(async (cb, position) => {
          return await prisma.chapter.create({
            data: {
              ...cb,
              courseId: course.id,
              position,
            },
          });
        }),
      );

      const ogImageRes = await generateStaticCourseOgImage({
        ogUrl: OG_URL,
        title: course.title,
        creatorName: ctx.session.user.name ?? "",
        chapters: chapters.length,
        thumbnail: course.thumbnail ?? "",
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: course.id,
            variant: "og_course",
          })
        : undefined;

      const updatedCourse = await prisma.course.update({
        where: {
          id: course.id,
        },
        data: {
          ogImage,
        },
        include: {
          creator: true,
        },
      });

      return { ...updatedCourse, chapters, discount };
    }),

  adminImport: protectedProcedure
    .input(adminImportCourseFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      if (!input) throw new TRPCError({ code: "BAD_REQUEST" });

      if (!isAdmin(ctx.session.user.email ?? ""))
        throw new TRPCError({ code: "BAD_REQUEST" });

      const existingCourse = await prisma.course.findFirst({
        where: { ytId: input.ytId },
      });

      if (existingCourse) throw new TRPCError({ code: "BAD_REQUEST" });

      const course = await prisma.course.create({
        data: {
          title: input.title,
          description: input.description,
          thumbnail: input.thumbnail,
          // creatorId: ctx.session.user.id,
          ytId: input.ytId,
          price: parseInt(input.price),
          permanentDiscount: parseInt(input.permanentDiscount),
          ytChannelId: input.ytChannelId,
          ytChannelName: input.ytChannelName,
          ytChannelImage: input.ytChannelImage,
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { id: tag.id },
              create: { title: tag.title },
            })),
          },
          categoryId: input?.category?.id,
        },
      });

      const chapters = await Promise.all(
        input.chapters.map(async (cb, position) => {
          return await prisma.chapter.create({
            data: {
              ...cb,
              courseId: course.id,
              // creatorId: ctx.session.user.id,
              position,
            },
          });
        }),
      );

      const ogImageRes = await generateStaticCourseOgImage({
        ogUrl: OG_URL,
        title: course.title,
        creatorName: course.ytChannelName ?? "",
        chapters: chapters.length,
        thumbnail: course.thumbnail ?? "",
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: course.id,
            variant: "og_course",
          })
        : undefined;

      const updatedCourse = await prisma.course.update({
        where: {
          id: course.id,
        },
        data: {
          ogImage,
        },
      });

      return { ...updatedCourse, chapters };
    }),

  syncImport: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.id },
        include: {
          chapters: true,
        },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });
      const playlistData = await getPlaylistDataService(course?.ytId ?? "");

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      if (!playlistData) throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedCourse = await prisma.course.update({
        where: {
          id: input.id,
        },
        data: {
          title: playlistData.title,
          description: playlistData.description,
          thumbnail: playlistData.thumbnail,
          creatorId: ctx.session.user.id,
        },
      });

      const chapters = course.chapters;

      // delete removed chapters
      await Promise.all(
        chapters.map(async (chapter) => {
          const chapterExists = playlistData.videos.find(
            (video) => chapter.ytId === video.ytId,
          );

          if (!chapterExists)
            await prisma.chapter.delete({
              where: {
                id: chapter.id,
              },
            });
        }),
      );

      const updatedChapters = await Promise.all(
        playlistData.videos.map(async (video, idx) => {
          const chapterExists = chapters.find(
            (chapter) => chapter.ytId === video.ytId,
          );

          if (chapterExists) {
            const updatedChapter = await prisma.chapter.update({
              where: {
                id: chapterExists.id,
              },
              data: {
                title: video.title,
                thumbnail: video.thumbnail,
                position: idx,
                description: video.description,
                duration: video.duration,
              },
            });
            return updatedChapter;
          } else {
            const newChapter = await prisma.chapter.create({
              data: {
                title: video.title,
                thumbnail: video.thumbnail,
                position: idx,
                ytId: video.ytId,
                videoUrl: `https://www.youtube.com/watch?v=${video.ytId}`,
                courseId: course.id,
                description: video.description,
                duration: video.duration,
              },
            });
            return newChapter;
          }
        }),
      );

      const ogImageRes = await generateStaticCourseOgImage({
        ogUrl: OG_URL,
        title: updatedCourse.title,
        creatorName: ctx.session.user.name ?? "",
        chapters: updatedChapters.length,
        thumbnail: updatedCourse.thumbnail ?? "",
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: course.id,
            variant: "og_course",
          })
        : undefined;

      const ogUpdatedCourse = await prisma.course.update({
        where: {
          id: input.id,
        },
        data: {
          ogImage,
        },
      });

      return { ...ogUpdatedCourse, chapters: updatedChapters };
    }),

  addClaimCourseRequest: publicProcedure
    .input(z.object({ courseId: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const claimRequest = await prisma.claimCourseRequest.create({
        data: {
          ...input,
        },
      });
      await sendClaimCourseRequest({ ...input });

      return claimRequest;
    }),
});
