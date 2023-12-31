import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { imageUploadFromB64, imageUploadFromBody } from "@/server/helpers/s3";
import isBase64 from "is-base64";
import { audienceRouter } from "./audience";
import { env } from "@/env.mjs";
import { generateStaticCreatorOgImage } from "@/server/services/og";
import { CoursePublishStatus } from "@prisma/client";
import { replaceS3UrlsWithCloudFront } from "@/server/helpers/cloud-front";

const { NEXTAUTH_URL } = env;

const OG_URL = `${
  process.env.VERCEL ? "https://" : ""
}${NEXTAUTH_URL}/api/og/creator`;

export const creatorRouter = createTRPCRouter({
  getAllCreators: publicProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const creators = await prisma.user.findMany({
      where: {
        isCreator: true,
      },
    });

    return creators;
  }),

  getPublicProfile: publicProcedure
    .input(
      z.object({
        creatorProfile: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { creatorProfile } = input;
      const { prisma } = ctx;

      const creator = await prisma.user.findUnique({
        where: {
          creatorProfile: creatorProfile,
        },
        include: {
          socialLinks: true,
          courses: {
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
            where: {
              publishStatus: CoursePublishStatus.PUBLISHED,
            },
          },
          accounts: true,
          events: {
            where: {
              endTime: {
                gte: new Date(),
              },
            },
          },
        },
      });

      const testimonials = await prisma.testimonial.findMany({
        where: { creatorProfile },
        include: { user: true },
      });

      return { ...creator, testimonials };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        socialLinks: true,
        testimonials: true,
        registrations: true,
        learningStreak: true,
      },
    });

    const registrations = await prisma.event.findMany({
      where: {
        id: { in: user?.registrations.map((r) => r.eventId) },
        endTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    const cloudFrontProfileUrl = replaceS3UrlsWithCloudFront(user?.image ?? "");
    const cloudFrontOgImageUrl = replaceS3UrlsWithCloudFront(
      user?.ogImage ?? "",
    );

    return {
      ...user,
      registrations,
      image: cloudFrontProfileUrl,
      ogImage: cloudFrontOgImageUrl,
    };
  }),

  getProfileNoLinks: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const user = await prisma.user.findUnique({
        where: {
          id: input.id,
        },
      });
      return user;
    }),

  getPastEvents: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const registrationId = await prisma.registration.findMany({
      where: { userId: ctx.session.user.id },
    });

    const pastRegistrations = await prisma.event.findMany({
      where: {
        id: { in: registrationId.map((r) => r.eventId) },
        endTime: {
          lte: new Date(),
        },
      },
      orderBy: {
        datetime: "desc",
      },
    });

    return pastRegistrations;
  }),

  searchCreators: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const creators = await prisma.user.findMany({
        where: {
          creatorProfile: {
            contains: input,
          },
          AND: {
            isCreator: true,
          },
        },
      });

      return creators;
    }),

  userNameAvailable: publicProcedure
    .input(z.object({ creatorProfile: z.string() }))
    .query(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const { creatorProfile } = input;
      const user = await prisma.user.findUnique({
        where: {
          creatorProfile,
        },
      });
      return user ? false : true;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        creatorProfile: z.string(),
        bio: z.string(),
        name: z.string(),
        socialLink: z
          .object({ type: z.string(), url: z.string() })
          .array()
          .optional(),
        topmateUrl: z.string().url().optional().or(z.literal("")),
        mobileNumber: z.union([
          z.string().min(10).max(10),
          z.undefined(),
          z.string().optional(),
        ]),
        image: z.string().nonempty(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const { bio, name, topmateUrl, creatorProfile, socialLink } = input;

      if (socialLink) {
        for (const sl of socialLink) {
          await prisma.socialLink.upsert({
            where: {
              type_creatorId: {
                type: sl.type,
                creatorId: ctx.session.user.id,
              },
            },
            update: { url: sl.url },
            create: {
              ...sl,
              creator: { connect: { id: ctx.session.user.id } },
            },
          });
        }
      }

      let image = input.image;
      if (isBase64(input.image, { allowMime: true })) {
        image = await imageUploadFromB64({
          base64: input.image,
          id: ctx.session.user.id,
          variant: "creator",
        });
      }

      const ogImageRes = await generateStaticCreatorOgImage({
        ogUrl: OG_URL,
        name,
        creatorProfile,
        image,
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: ctx.session.user.id,
            variant: "og_creator",
          })
        : undefined;

      const user = await prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          creatorProfile:
            creatorProfile === "" ? ctx.session.user.email : creatorProfile,
          bio: bio,
          mobileNumber: input.mobileNumber,
          name: name,
          topmateUrl,
          image,
          ogImage,
        },
      });

      const socialLinks = await prisma.socialLink.findMany({
        where: {
          creatorId: ctx.session.user.id,
        },
      });

      return { ...user, socialLinks };
    }),

  updateDashboardProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string().nonempty(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;
      const { name } = input;

      let image = input.image;
      if (isBase64(input.image, { allowMime: true })) {
        image = await imageUploadFromB64({
          base64: input.image,
          id: ctx.session.user.id,
          variant: "creator",
        });
      }

      const user = await prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: name,
          image,
        },
      });

      return { ...user };
    }),

  makeCreator: protectedProcedure
    .input(z.object({ creatorProfile: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const ogImageRes = await generateStaticCreatorOgImage({
        ogUrl: OG_URL,
        name: ctx.session.user.name ?? "",
        creatorProfile: input.creatorProfile ?? "",
        image: ctx.session.user.image ?? "",
      });

      const ogImage = ogImageRes
        ? await imageUploadFromBody({
            body: ogImageRes.data as AWS.S3.Body,
            id: ctx.session.user.id,
            variant: "og_creator",
          })
        : undefined;

      const creator = await prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          isCreator: true,
          creatorProfile:
            input.creatorProfile && input.creatorProfile !== ""
              ? input.creatorProfile
              : ctx.session.user.email?.split("@")[0],
          ogImage,
        },
      });

      return creator;
    }),

  updateSocialLink: protectedProcedure
    .input(z.object({ id: z.string(), type: z.string(), url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const socialLink = await prisma.socialLink.update({
        where: {
          id: input.id,
        },
        data: {
          type: input.type,
          url: input.url,
          creatorId: ctx.session.user.id,
        },
      });

      return socialLink;
    }),

  createSocialLink: protectedProcedure
    .input(z.object({ type: z.string(), url: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const socialLink = await prisma.socialLink.create({
        data: {
          type: input.type,
          url: input.url,
          creatorId: ctx.session.user.id,
        },
      });

      return socialLink;
    }),

  deleteSocialLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { prisma } = ctx;

      const socialLink = await prisma.socialLink.delete({
        where: {
          id: input.id,
        },
      });

      return socialLink;
    }),

  audience: audienceRouter,
});
