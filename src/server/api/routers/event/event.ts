import { z } from "zod";
import type AWS from "aws-sdk";
import { env } from "@/env.mjs";
const { NEXTAUTH_URL } = env;

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { createFormSchema } from "@/pages/event/create";

import {
  deleteS3File,
  imageUploadFromB64,
  imageUploadFromBody,
} from "@/server/helpers/s3";
import isBase64 from "is-base64";
import { sendRegistrationConfirmation } from "@/server/helpers/emailHelper";
import { generateStaticEventOgImage } from "@/server/services/og";
import { TRPCError } from "@trpc/server";
import { replaceS3UrlsWithCloudFront } from "@/server/helpers/cloud-front";

const OG_URL = `${
  process.env.VERCEL ? "https://" : ""
}${NEXTAUTH_URL}/api/og/event`;

export const eventRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const event = await prisma.event.findUnique({
        where: {
          id: input.id,
        },
        include: {
          creator: true,
          registrations: {
            include: {
              user: true,
            },
          },
        },
      });
      const cloudFrontEventThumbnailUrl = replaceS3UrlsWithCloudFront(
        event?.thumbnail ?? "",
      );
      const cloudFrontEventOgImage = replaceS3UrlsWithCloudFront(
        event?.ogImage ?? "",
      );

      if (event?.creator.id !== ctx.session.user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      return {
        ...event,
        thumbnail: cloudFrontEventThumbnailUrl,
        ogImage: cloudFrontEventOgImage,
      };
    }),

  // Used for RouterOutputs don't remove.
  getEvent: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const event = await prisma.event.findUnique({
        where: {
          id: input.id,
        },
        include: {
          creator: true,
          hosts: {
            include: {
              user: true,
            },
          },
        },
      });

      const eventHosts = event?.hosts ?? [];
      const hosts = [
        ...eventHosts,
        { id: event?.creator.id, user: event?.creator },
      ];

      const cloudFrontEventThumbnailUrl = replaceS3UrlsWithCloudFront(
        event?.thumbnail ?? "",
      );
      const cloudFrontEventOgImage = replaceS3UrlsWithCloudFront(
        event?.ogImage ?? "",
      );

      return {
        ...event,
        hosts: hosts,
        thumbnail: cloudFrontEventThumbnailUrl,
        ogImage: cloudFrontEventOgImage,
      };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const events = await prisma.event.findMany({
      where: {
        creatorId: ctx.session.user.id,
        endTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        datetime: "asc",
      },
    });

    const eventDetailsWithThumbnailsAndOGImages = events.map((event) => {
      const thumbnail =
        event.thumbnail !== null
          ? replaceS3UrlsWithCloudFront(event.thumbnail)
          : null;
      const ogImage =
        event.ogImage !== null
          ? replaceS3UrlsWithCloudFront(event.ogImage)
          : null;

      return {
        ...event,
        thumbnail: thumbnail,
        ogImage: ogImage,
      };
    });

    return eventDetailsWithThumbnailsAndOGImages;
  }),

  getAllPast: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const events = await prisma.event.findMany({
      where: {
        creatorId: ctx.session.user.id,
        endTime: {
          lte: new Date(),
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    const eventDetailsWithThumbnailsAndOGImages = events.map((event) => {
      const thumbnail =
        event.thumbnail !== null
          ? replaceS3UrlsWithCloudFront(event.thumbnail)
          : null;
      const ogImage =
        event.ogImage !== null
          ? replaceS3UrlsWithCloudFront(event.ogImage)
          : null;

      return {
        ...event,
        thumbnail: thumbnail,
        ogImage: ogImage,
      };
    });

    return eventDetailsWithThumbnailsAndOGImages;
  }),

  isRegistered: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(({ ctx, input }) => {
      const { prisma } = ctx;

      if (!ctx.session) return null;

      const registration = prisma.registration.findFirst({
        where: {
          userId: ctx.session.user.id,
          eventId: input.eventId,
        },
      });

      return registration;
    }),

  create: protectedProcedure
    .input(createFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      if (!input) throw new TRPCError({ code: "BAD_REQUEST" });

      const event = await prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          datetime: input.datetime,
          endTime: input.endTime,
          eventUrl: input.eventUrl ?? "",
          eventLocation: input.eventLocation ?? "",
          eventType: input.eventType,
          // duration: input.duration,

          creatorId: ctx.session.user.id,
        },
      });

      const thumbnail = await imageUploadFromB64({
        base64: input.thumbnail,
        id: event.id,
        variant: "event",
      });

      const ogImageRes = await generateStaticEventOgImage({
        ogUrl: OG_URL,
        title: input.title,
        datetime: input.datetime,
        host: ctx.session.user.name ?? "",
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: event.id,
            variant: "og_event",
          })
        : undefined;

      const updatedEvent = await prisma.event.update({
        where: {
          id: event.id,
        },
        data: {
          thumbnail,
          ogImage,
        },
        include: {
          creator: true,
        },
      });

      return updatedEvent;
    }),

  update: protectedProcedure
    .input(createFormSchema.and(z.object({ id: z.string() })))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      if (!input) throw new TRPCError({ code: "BAD_REQUEST" });

      const checkIsCreator = await prisma.event.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!checkIsCreator)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event doesn't exist",
        });

      if (checkIsCreator.creatorId !== ctx.session.user.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You didn't create this event",
        });

      const event = await prisma.event.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!event) throw new TRPCError({ code: "BAD_REQUEST" });

      let thumbnail = input.thumbnail;
      if (isBase64(input.thumbnail, { allowMime: true })) {
        thumbnail = await imageUploadFromB64({
          base64: input.thumbnail,
          id: input.id,
          variant: "event",
        });
      }

      const ogImageRes = await generateStaticEventOgImage({
        ogUrl: OG_URL,
        title: input.title,
        datetime: input.datetime,
        host: ctx.session.user.name ?? "",
      });

      const ogImage: string | undefined = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: input.id,
            variant: "og_event",
          })
        : undefined;

      const updatedEvent = await prisma.event.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
          datetime: input.datetime,
          eventUrl: input.eventUrl ?? "",
          eventLocation: input.eventLocation ?? "",
          eventType: input.eventType,
          thumbnail: thumbnail,
          ogImage,
          endTime: input.endTime,

          creatorId: ctx.session.user.id,
        },
      });

      return updatedEvent;
    }),

  register: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!event || !user) throw new TRPCError({ code: "BAD_REQUEST" });

      if (event.creatorId === user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          eventId: event.id,
        },
      });

      const audienceMember = await prisma.audienceMember.findFirst({
        where: {
          email: user.email,
          creatorId: event.creatorId,
        },
      });

      const hosts = await prisma.host.findMany({
        where: {
          eventId: event.id,
        },
      });

      /* Adding to audience list */
      if (!audienceMember) {
        // if audience member doesn't exist, create one
        await prisma.audienceMember.create({
          data: {
            email: user.email,
            name: user.name,
            userId: user.id,
            creatorId: event.creatorId,
            eventId: event.id,
          },
        });
      }

      // Create audience member for all hosts
      for (const host of hosts) {
        const audienceMember = await prisma.audienceMember.findFirst({
          where: {
            email: user.email,
            creatorId: host.userId,
          },
        });

        if (!audienceMember)
          await prisma.audienceMember.create({
            data: {
              email: user.email,
              name: user.name,
              userId: user.id,
              creatorId: host.userId,
              eventId: event.id,
            },
          });
      }

      const creator = await prisma.user.findUnique({
        where: {
          id: event.creatorId,
        },
      });

      try {
        await sendRegistrationConfirmation(
          event,
          creator,
          user.email,
          user.name,
        );
      } catch (e) {
        console.log(e);
      }

      return registration;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const event = await prisma.event.delete({
        where: {
          id: input.id,
        },
      });

      void deleteS3File({
        path: event.thumbnail?.split("amazonaws.com/")[1] ?? "",
      });

      void deleteS3File({
        path: event.ogImage?.split("amazonaws.com/")[1] ?? "",
      });

      return event;
    }),
});
