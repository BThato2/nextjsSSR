import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isAdmin } from "@/server/helpers/admin";
import { imageUploadFromBody } from "@/server/helpers/s3";
import { generateStaticCourseOgImage } from "@/server/services/og";
import { OG_URL } from "./youtube-course";

export const courseSectionRouter = createTRPCRouter({
  addSection: protectedProcedure
    .input(z.object({ courseId: z.string(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const lastSection = await prisma.courseSection.findFirst({
        where: { courseId: input.courseId },
        orderBy: {
          position: "desc",
        },
      });

      const lastPos = lastSection?.position ?? -1;

      const addedSection = await prisma.courseSection.create({
        data: {
          courseId: input.courseId,
          title: input.title,
          position: lastPos + 1,
        },
      });

      return addedSection;
    }),

  editSectionTitle: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const section = await prisma.courseSection.findUnique({
        where: { id: input.id },
        include: { course: true },
      });

      if (!section) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        section?.course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const editedSection = await prisma.courseSection.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
        },
      });

      return editedSection;
    }),

  deleteSection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const section = await prisma.courseSection.findUnique({
        where: { id: input.id },
        include: {
          course: { include: { _count: { select: { blocksChapters: true } } } },
          _count: { select: { chapters: true } },
        },
      });

      if (!section) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        section?.course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updateOg = async () => {
        const ogImageRes = await generateStaticCourseOgImage({
          ogUrl: OG_URL,
          title: section?.course.title,
          creatorName: ctx.session.user.name ?? "",
          chapters:
            section?.course?._count?.blocksChapters - section?._count?.chapters,
          thumbnail: section?.course?.thumbnail ?? "",
        });

        const ogImage: string | undefined = ogImageRes
          ? await imageUploadFromBody({
              body: ogImageRes.data as AWS.S3.Body,
              id: section?.course?.id,
              variant: "og_course",
            })
          : undefined;

        await prisma.course.update({
          where: { id: section?.course?.id },
          data: { ogImage },
        });
      };

      void updateOg();

      const deletedSection = await prisma.courseSection.delete({
        where: {
          id: input.id,
        },
      });

      return deletedSection;
    }),

  rearrangeSections: protectedProcedure
    .input(z.object({ courseId: z.string(), sectionsIds: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedSections = await Promise.all(
        input.sectionsIds.map(async (sectionId, position) => {
          return await prisma.courseSection.update({
            where: { id: sectionId },
            data: { position },
          });
        }),
      );

      return updatedSections;
    }),

  addChapter: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        sectionId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.courseId },
        include: { _count: { select: { blocksChapters: true } } },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updateOg = async () => {
        const ogImageRes = await generateStaticCourseOgImage({
          ogUrl: OG_URL,
          title: course.title,
          creatorName: ctx.session.user.name ?? "",
          chapters: course?._count?.blocksChapters + 1,
          thumbnail: course?.thumbnail ?? "",
        });

        const ogImage: string | undefined = ogImageRes
          ? await imageUploadFromBody({
              body: ogImageRes.data as AWS.S3.Body,
              id: course?.id,
              variant: "og_course",
            })
          : undefined;

        await prisma.course.update({
          where: { id: course?.id },
          data: { ogImage },
        });
      };

      void updateOg();

      const lastChapter = await prisma.blocksChapter.findFirst({
        where: { courseId: input.courseId, sectionId: input.sectionId },
        orderBy: {
          position: "desc",
        },
      });

      const lastPos = lastChapter?.position ?? -1;

      const addedChapter = await prisma.blocksChapter.create({
        data: {
          courseId: input.courseId,
          sectionId: input.sectionId,
          title: input.title,
          position: lastPos + 1,
        },
      });

      return addedChapter;
    }),

  deleteChapter: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const chapter = await prisma.blocksChapter.findUnique({
        where: { id: input.id },
        include: {
          course: { include: { _count: { select: { blocksChapters: true } } } },
        },
      });

      if (!chapter) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        chapter?.course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updateOg = async () => {
        const ogImageRes = await generateStaticCourseOgImage({
          ogUrl: OG_URL,
          title: chapter?.course.title,
          creatorName: ctx.session.user.name ?? "",
          chapters: chapter?.course?._count?.blocksChapters - 1,
          thumbnail: chapter?.course?.thumbnail ?? "",
        });

        const ogImage: string | undefined = ogImageRes
          ? await imageUploadFromBody({
              body: ogImageRes.data as AWS.S3.Body,
              id: chapter?.course?.id,
              variant: "og_course",
            })
          : undefined;

        await prisma.course.update({
          where: { id: chapter?.course?.id },
          data: { ogImage },
        });
      };

      void updateOg();

      const deletedChapter = await prisma.blocksChapter.delete({
        where: {
          id: input.id,
        },
      });

      return deletedChapter;
    }),

  rearrangeChapters: protectedProcedure
    .input(
      z.object({
        sectionId: z.string(),
        chaptersIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const section = await prisma.courseSection.findUnique({
        where: { id: input.sectionId },
        include: { course: true },
      });

      if (!section) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        section?.course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedChapters = await Promise.all(
        input.chaptersIds.map(async (chapterId, position) => {
          return await prisma.blocksChapter.update({
            where: { id: chapterId },
            data: { position },
          });
        }),
      );

      return updatedChapters;
    }),

  editChapterTitle: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const chapter = await prisma.blocksChapter.findUnique({
        where: { id: input.id },
        include: { course: true },
      });

      if (!chapter) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        chapter?.course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const editedChapter = await prisma.blocksChapter.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
        },
      });

      return editedChapter;
    }),
});
