import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

import { isAdmin } from "@/server/helpers/admin";
import { TRPCError } from "@trpc/server";
import { CoursePublishStatus } from "@prisma/client";
import { blocksToHTML } from "@/server/helpers/block";
import {
  getCoursePrivateSignedUrl,
  replaceS3UrlsWithCloudFront,
} from "@/server/helpers/cloud-front";
import { type RichTextBlock } from "interfaces/Block";

export const courseRouter = createTRPCRouter({
  // hello: publicProcedure.query(() => "hello"),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: {
          id: input.id,
        },
        include: {
          creator: true,
          chapters: {
            include: {
              chapterProgress: {
                where: { watchedById: ctx.session.user.id },
                take: 1,
              },
            },
            orderBy: {
              position: "asc",
            },
          },
          sections: {
            include: {
              chapters: {
                orderBy: {
                  position: "asc",
                },
              },
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },
          blocksChapters: true,
          _count: {
            select: {
              sections: true,
              blocksChapters: true,
            },
          },
          courseProgress: {
            where: { watchedById: ctx.session.user.id },
            take: 1,
            include: {
              lastChapterProgress: true,
            },
          },
          enrollments: {
            include: {
              user: true,
            },
          },
          tags: true,
          category: true,
          discount: true,
        },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });
      const isEnrolled = course?.enrollments.find(
        (er) => ctx.session.user.id === er.userId,
      );

      if (
        !isEnrolled &&
        ctx.session.user.id !== course?.creatorId &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const courseProgress = course.courseProgress[0];

      const chapters = course.chapters.map((chapter) => ({
        ...chapter,
        chapterProgress: chapter.chapterProgress[0],
      }));

      const htmlDescription = blocksToHTML(
        course?.blocksDecription as RichTextBlock[],
      );

      const cloudFrontCourseThumbnailUrl = replaceS3UrlsWithCloudFront(
        course?.thumbnail ?? "",
      );

      const cloudFrontCourseOgImageUrl = replaceS3UrlsWithCloudFront(
        course?.ogImage ?? "",
      );

      return {
        ...course,
        chapters,
        courseProgress,
        blocksDecription: course?.blocksDecription as
          | RichTextBlock[]
          | undefined,
        htmlDescription,
        thumbnail: cloudFrontCourseThumbnailUrl,
        ogImage: cloudFrontCourseOgImageUrl,
      };
    }),

  // Used for RouterOutputs don't remove.
  getCourse: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: {
          id: input.id,
        },
        include: {
          creator: true,
          chapters: true,
          tags: true,
          category: true,
          discount: true,
          sections: {
            include: {
              chapters: {
                orderBy: {
                  position: "asc",
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },
          _count: {
            select: {
              sections: true,
              blocksChapters: true,
            },
          },
        },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      const chapters = course.chapters;

      chapters.sort((a, b) => a.position - b.position);

      const previewChapter = chapters[0];

      const htmlDescription = blocksToHTML(
        course?.blocksDecription as RichTextBlock[],
      );

      const cloudFrontCourseThumbnailUrl = replaceS3UrlsWithCloudFront(
        course?.thumbnail ?? "",
      );
      const cloudFrontCourseOgImageUrl = replaceS3UrlsWithCloudFront(
        course?.ogImage ?? "",
      );

      // TODO: exclude ytId and videoUrl from chapters
      return {
        ...course,
        previewChapter,
        blocksDecription: course?.blocksDecription as
          | RichTextBlock[]
          | undefined,
        htmlDescription,
        thumbnail: cloudFrontCourseThumbnailUrl,
        ogImage: cloudFrontCourseOgImageUrl,
      };
    }),

  getAll: protectedProcedure
    .input(z.object({ searchQuery: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const courses = await prisma.course.findMany({
        where: {
          creatorId: ctx.session.user.id,
          title: {
            contains: input?.searchQuery ?? "",
          },
        },
        include: {
          _count: {
            select: {
              chapters: true,
              sections: true,
              blocksChapters: true,
            },
          },
          tags: true,
          category: true,
          discount: true,
        },
      });

      const courseDetailsWithThumbnailsAndOGImages = courses.map((course) => {
        const thumbnail =
          course.thumbnail !== null
            ? replaceS3UrlsWithCloudFront(course.thumbnail)
            : null;
        const ogImage =
          course.ogImage !== null
            ? replaceS3UrlsWithCloudFront(course.ogImage)
            : null;

        return {
          ...course,
          thumbnail,
          ogImage,
        };
      });

      return courseDetailsWithThumbnailsAndOGImages;
    }),

  getAllPublic: publicProcedure
    .input(
      z
        .object({
          searchQuery: z.string().optional(),
          categoryTitle: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const query: {
        title: {
          contains: string;
        };
        category:
          | {
              title: {
                equals: string | undefined;
              };
            }
          | undefined;
      } = {
        title: {
          contains: input?.searchQuery ?? "",
        },
        category: {
          title: {
            equals: input?.categoryTitle,
          },
        },
      };

      if (!input?.categoryTitle) delete query["category"];

      const courses = await prisma.course.findMany({
        where: query,
        include: {
          _count: {
            select: {
              chapters: true,
            },
          },
          creator: true,
          tags: true,
          category: true,
          discount: true,
        },
      });

      const coursesWithLilCreatorData = courses.map((course) => ({
        ...course,
        creator: course?.creatorId
          ? {
              id: course?.creator?.id,
              name: course?.creator?.name,
              image: course?.creator?.image,
              creatorProfile: course?.creator?.creatorProfile,
            }
          : undefined,
      }));

      return coursesWithLilCreatorData;
    }),

  getAllAdmin: protectedProcedure
    .input(z.object({ searchQuery: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      if (!isAdmin(ctx.session.user.email ?? ""))
        throw new TRPCError({ code: "BAD_REQUEST" });

      const myCourses = await prisma.course.findMany({
        where: {
          creatorId: ctx.session.user.id,
          title: {
            contains: input?.searchQuery ?? "",
          },
        },
        include: {
          _count: {
            select: {
              chapters: true,
              sections: true,
              blocksChapters: true,
            },
          },
          tags: true,
          category: true,
          discount: true,
        },
      });

      const unclaimedCourses = await prisma.course.findMany({
        where: {
          creatorId: null,
          title: {
            startsWith: input?.searchQuery ?? "",
          },
        },
        include: {
          _count: {
            select: {
              chapters: true,
              sections: true,
              blocksChapters: true,
            },
          },
          discount: true,
        },
      });

      return [...myCourses, ...unclaimedCourses];
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      if (!input) throw new TRPCError({ code: "BAD_REQUEST" });

      const course = await prisma.course.create({
        data: {
          title: input.title,
          creatorId: ctx.session.user.id,
          publishStatus: CoursePublishStatus.DRAFT,
        },
      });

      return course;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!course) throw new TRPCError({ code: "BAD_REQUEST" });

      if (
        course.creatorId !== ctx.session.user.id &&
        !isAdmin(ctx.session.user.email ?? "")
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const courseDeleted = await prisma.course.delete({
        where: {
          id: input.id,
        },
      });

      return courseDeleted;
    }),

  getSignedUrl: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        url: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await getCoursePrivateSignedUrl({
        userId: ctx.session.user.id,
        unsignedUrl: input.url,
        courseId: input.courseId,
      });
    }),
});

// export type definition of API
export type CourseRouter = typeof courseRouter;
