import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { blockSchema, type Block } from "interfaces/Block";
import { TRPCError } from "@trpc/server";
import {
  type Block as PrismaBlock,
  BlockType,
  type BlocksChapter,
  type Course,
} from "@prisma/client";
import { deleteS3File, getVideoUploadPresignedURL } from "@/server/helpers/s3";
import { replaceS3UrlsWithCloudFront } from "@/server/helpers/cloud-front";
// import { replaceS3UrlsWithCloudFront } from "@/server/helpers/cloud-front";

export const courseSectionChapterRouter = createTRPCRouter({
  saveBlocks: protectedProcedure
    .input(
      z.object({
        blocks: z.array(z.any()),
        chapterId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const { blocks, chapterId } = input as {
        blocks: Block[];
        chapterId: string;
      };

      const chapter = await prisma.blocksChapter.findUnique({
        where: { id: chapterId },
        include: { course: true, blocks: { orderBy: { position: "asc" } } },
      });

      if (!chapter || chapter.course?.creatorId !== ctx.session.user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      try {
        // delete blocks & s3 videos
        await Promise.all(
          (chapter?.blocks as Block[])?.map(async (block) => {
            const shouldDeleteBlock = !blocks.find((b) => b.id === block.id);

            if (shouldDeleteBlock) {
              if (block.type === BlockType.video) {
                void deleteS3File({ path: `private/video_${block.id}` });
              }

              await prisma.block.delete({ where: { id: block.id } });
            }

            const newBlock = blocks.find((b) => b.id === block.id);
            if (!newBlock) return;
            const shouldDeleteVideo =
              (!newBlock?.props?.videoUrl ||
                newBlock?.props?.videoUrl === "") &&
              !!block?.props?.videoUrl;

            if (shouldDeleteVideo) {
              if (block.type === BlockType.video) {
                void deleteS3File({ path: `private/video_${block.id}` });
              }

              await prisma.block.delete({ where: { id: block.id } });
            }
          }),
        );

        const updatedBlocks = await Promise.all(
          blocks.map(async (block) => {
            const blockExist = await prisma.block.findUnique({
              where: { id: block.id },
            });

            if (blockExist) {
              return await prisma.block.update({
                where: { id: block.id },
                data: block,
              });
            } else {
              return await prisma.block.create({
                data: block,
              });
            }
          }),
        );

        return { ...chapter, blocks: updatedBlocks as unknown as Block[] };
      } catch (err) {
        console.log("Error in saving blocks: ", err);
      }
    }),

  get: protectedProcedure
    .input(z.object({ chapterId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const chapter = await prisma.blocksChapter.findUnique({
        where: { id: input.chapterId },
        include: {
          course: true,
          blocks: {
            orderBy: {
              position: "asc",
            },
          },
        },
      });

      const isEnrolled = await prisma.enrollment.findFirst({
        where: {
          courseId: chapter?.courseId,
          userId: ctx.session.user.id,
        },
      });

      if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        chapter?.locked &&
        !isEnrolled &&
        ctx.session.user.id !== chapter?.course?.creatorId
      )
        throw new TRPCError({ code: "BAD_REQUEST" });

      const blocksWithCloudFront = (chapter?.blocks as Block[])?.map(
        (block) => {
          if (block.type === BlockType.video && !!block.props.videoUrl)
            return {
              ...block,
              props: {
                ...block.props,
                videoUrl: replaceS3UrlsWithCloudFront(block.props.videoUrl),
              },
            };
          return block;
        },
      );

      return {
        ...chapter,
        blocks: blocksWithCloudFront,
      };
    }),

  uploadBlockVideo: protectedProcedure
    .input(z.object({ block: blockSchema }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      let block:
        | (PrismaBlock & { chapter: BlocksChapter & { course: Course } })
        | null = await prisma.block.findUnique({
        where: { id: input.block.id },
        include: { chapter: { include: { course: true } } },
      });

      if (!!block && block?.chapter?.course?.creatorId !== ctx.session.user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      if (!block) {
        block = await prisma.block.create({
          data: input.block as Block,
          include: { chapter: { include: { course: true } } },
        });
      }

      const uploadURL = await getVideoUploadPresignedURL({
        id: block.id,
        privateCourseId: block.chapter.course.id,
      });

      if (uploadURL === 500) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const updatedBlock = await prisma.block.update({
        where: { id: block.id },
        data: {
          props: {
            ...(block as unknown as Block).props,
            videoUrl: replaceS3UrlsWithCloudFront(
              uploadURL.split("?")[0] ?? "",
            ),
          },
        },
      });

      return { ...(updatedBlock as Block), uploadURL };
    }),
});
