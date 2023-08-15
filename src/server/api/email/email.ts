import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sendUpdatePreview } from "@/server/helpers/emailHelper";

export const emailRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const emails = await prisma.courseInvitation.findMany({
      where: {
        creatorId: ctx.session.user.id,
      },
      include: {
        recipients: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return emails;
  }),

  getEmail: protectedProcedure
    .input(z.object({ emailUniqueId: z.string() }))
    .query(({ ctx, input }) => {
      const { prisma } = ctx;
      const { emailUniqueId } = input;

      return prisma.courseInvitation.findUnique({
        where: {
          id: emailUniqueId,
        },
        include: {
          recipients: true,
        },
      });
    }),

  getDraftInvitation: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const emails = await prisma.courseInvitation.findMany({
      where: {
        creatorId: ctx.session.user.id,
        sent: false,
      },
      include: {
        recipients: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return emails;
  }),

  getSentInvitation: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const invitations = await prisma.courseInvitation.findMany({
      where: {
        creatorId: ctx.session.user.id,
        sent: true,
      },
      include: {
        recipients: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return invitations;
  }),

  create: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        body: z.string(),
        courseId: z.string(),
        isStyled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const invitation = await prisma.courseInvitation.create({
        data: {
          subject: input.subject,
          body: input.body,
          from: ctx.session.user.email ?? "",
          sent: false,
          creatorId: ctx.session.user.id,
          courseId: input.courseId,
          isStyled: input.isStyled,
        },
      });

      return invitation;
    }),

  update: protectedProcedure
    .input(
      z.object({
        emailUniqueId: z.string(),
        subject: z.string(),
        body: z.string(),
        isStyled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const invitation = await prisma.courseInvitation.update({
        where: {
          id: input.emailUniqueId,
        },
        data: {
          subject: input.subject,
          body: input.body,
          from: ctx.session.user.email ?? "",
          sent: false,
          creator: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      return invitation;
    }),

  addRecipients: protectedProcedure
    .input(
      z.object({
        emailUniqueId: z.string(),
        emails: z.string().array(),
        courseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const courseEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: input.courseId,
        },
        include: {
          user: true,
        },
      });

      const courseEnrollmentEmails = courseEnrollments.map((e) => e.user.email);
      const unenrolledEmailsToAdd = input.emails.filter(
        (a) => !courseEnrollmentEmails.includes(a),
      );

      const email = await prisma.courseInvitation.findUnique({
        where: {
          id: input.emailUniqueId,
        },
      });

      if (!email) throw new TRPCError({ code: "BAD_REQUEST" });

      const recipients = await prisma.recipient.createMany({
        data: unenrolledEmailsToAdd.map((e) => ({
          email: e,
          courseInvitationId: email.id,
        })),
        skipDuplicates: true,
      });

      return recipients;
    }),

  removeRecipients: protectedProcedure
    .input(z.object({ emailUniqueId: z.string(), emails: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      await prisma.recipient.deleteMany({
        where: {
          email: {
            in: input.emails,
          },
          courseInvitationId: input.emailUniqueId,
        },
      });
    }),

  importFromAudience: protectedProcedure
    .input(z.object({ emailUniqueId: z.string(), courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const courseEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: input.courseId,
        },
        include: {
          user: true,
        },
      });

      const audienceMemebers = await prisma.audienceMember.findMany({
        where: {
          userId: ctx.session.user.id,
        },
      });

      if (!courseEnrollments) throw new TRPCError({ code: "BAD_REQUEST" });
      if (!audienceMemebers) throw new TRPCError({ code: "NOT_FOUND" });

      const courseEnrollmentEmails = courseEnrollments.map((e) => e.user.email);
      const unenrolledEmailsToAdd = audienceMemebers.filter(
        (a) => !courseEnrollmentEmails.includes(a.email),
      );

      const recipients = await prisma.recipient.createMany({
        data: unenrolledEmailsToAdd.map((a) => ({
          email: a.email,
          courseInvitationId: input.emailUniqueId,
        })),
        skipDuplicates: true,
      });

      return recipients;
    }),

  importFromImportedAudience: protectedProcedure
    .input(z.object({ emailUniqueId: z.string(), courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const courseEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: input.courseId,
        },
        include: {
          user: true,
        },
      });

      const importedAudienceMembers =
        await prisma.importedAudieceMember.findMany({
          where: {
            userId: ctx.session.user.id,
          },
        });

      if (!courseEnrollments) throw new TRPCError({ code: "BAD_REQUEST" });
      if (!importedAudienceMembers) throw new TRPCError({ code: "NOT_FOUND" });

      const courseEnrollmentEmails = courseEnrollments.map((e) => e.user.email);
      const unenrolledEmailsToAdd = importedAudienceMembers.filter(
        (a) => !courseEnrollmentEmails.includes(a.email),
      );

      const recipients = await prisma.recipient.createMany({
        data: unenrolledEmailsToAdd.map((a) => ({
          email: a.email,
          courseInvitationId: input.emailUniqueId,
        })),
        skipDuplicates: true,
      });

      return recipients;
    }),

  delete: protectedProcedure
    .input(z.object({ emailUniqueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const email = await prisma.courseInvitation.delete({
        where: {
          id: input.emailUniqueId,
        },
      });

      return email;
    }),

  sendPreviewInvitation: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        body: z.string(),
        subject: z.string(),
        username: z.string(),
        isStyled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await sendUpdatePreview({
        email: input.email,
        body: input.body,
        subject: input.subject,
        username: input.username,
        isStyled: input.isStyled,
      });
    }),
});
