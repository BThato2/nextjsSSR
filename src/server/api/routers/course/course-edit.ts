import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { updateCourseLandingFormSchema } from "@/pages/creator/dashboard/course/[id]/manage";
import { TRPCError } from "@trpc/server";
import isBase64 from "is-base64";
import { generateStaticCourseOgImage } from "@/server/services/og";
import { imageUploadFromB64, imageUploadFromBody } from "@/server/helpers/s3";
import { isAdmin } from "@/server/helpers/admin";
import { OG_URL } from "./youtube-course";
import { updateCoursePricingFormSchema } from "@/pages/creator/dashboard/course/[id]/manage/pricing";
import { CoursePublishStatus } from "@prisma/client";
import { settingsFormSchema } from "@/pages/creator/dashboard/course/[id]/settings";

export const courseEditRouter = createTRPCRouter({
  updateLanding: protectedProcedure
    .input(updateCourseLandingFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.id },
        include: { _count: { select: { blocksChapters: true } } },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      let thumbnail = input.thumbnail;
      if (isBase64(input.thumbnail, { allowMime: true })) {
        thumbnail = await imageUploadFromB64({
          base64: input.thumbnail,
          id: input.id,
          variant: "course",
        });
      }

      const ogImageRes = await generateStaticCourseOgImage({
        ogUrl: OG_URL,
        title: course.title,
        creatorName: ctx.session.user.name ?? "",
        chapters: course?._count?.blocksChapters,
        thumbnail,
      });

      const ogImage: string | undefined = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: input.id,
            variant: "og_course",
          })
        : undefined;

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedCourse = await prisma.course.update({
        where: { id: input.id },
        data: {
          title: input.title,
          // description: input.description,
          blocksDecription: input.blocksDescription,
          thumbnail,
          ogImage,
          // price: parseInt(input.price),
          // permanentDiscount: parseInt(input.permanentDiscount),
          outcomes: input.outcomes,
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { id: tag.id },
              create: { title: tag.title },
            })),
          },
          startsAt: input.startsAt,
        },
        include: {
          // discount: true,
          creator: true,
          tags: true,
        },
      });

      return updatedCourse;
    }),

  updatePricing: protectedProcedure
    .input(updateCoursePricingFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.id },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedCourse = await prisma.course.update({
        where: { id: input.id },
        data: {
          price: parseInt(input.price),
          permanentDiscount: parseInt(input.permanentDiscount),
        },
        include: {
          discount: true,
          creator: true,
          tags: true,
        },
      });

      if (updatedCourse?.discount) {
        if (input.discount)
          await prisma.discount.update({
            where: {
              id: updatedCourse?.discount?.id,
            },
            data: {
              price: parseInt(input?.discount?.price),
              deadline: input?.discount?.deadline,
            },
          });
        else
          await prisma.discount.delete({
            where: {
              id: updatedCourse?.discount?.id,
            },
          });
      } else {
        if (input.discount)
          await prisma.discount.create({
            data: {
              courseId: updatedCourse?.id,
              price: parseInt(input?.discount?.price),
              deadline: input?.discount?.deadline,
            },
          });
      }

      return updatedCourse;
    }),

  updatePublishStatus: protectedProcedure
    .input(
      z.object({ id: z.string(), status: z.nativeEnum(CoursePublishStatus) }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.id },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedCourse = await prisma.course.update({
        where: { id: input.id },
        data: {
          publishStatus: input.status,
        },
        include: {
          creator: true,
          tags: true,
        },
      });

      return updatedCourse;
    }),

  settingsUpdate: protectedProcedure
    .input(settingsFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.id },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course?.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const updatedCourse = await prisma.course.update({
        where: { id: input.id },
        data: {
          price: parseInt(input.price),
          tags: {
            connectOrCreate: input.tags.map((tag) => ({
              where: { id: tag.id },
              create: { title: tag.title },
            })),
          },
          categoryId: input?.category?.id,
        },
        include: {
          discount: true,
        },
      });

      if (updatedCourse?.discount) {
        if (input.discount)
          await prisma.discount.update({
            where: {
              id: updatedCourse?.discount?.id,
            },
            data: {
              price: parseInt(input?.discount?.price),
              deadline: input?.discount?.deadline,
            },
          });
        else
          await prisma.discount.delete({
            where: {
              id: updatedCourse?.discount?.id,
            },
          });
      } else {
        if (input.discount)
          await prisma.discount.create({
            data: {
              courseId: updatedCourse?.id,
              price: parseInt(input?.discount?.price),
              deadline: input?.discount?.deadline,
            },
          });
      }

      return updatedCourse;
    }),
});
