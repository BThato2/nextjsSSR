import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { AccountType } from "@prisma/client";

export const bankDetailZodObject = z.object({
  accountName: z.string().nonempty("please enter your accountName"),
  accountNumber: z.string().nonempty("please enter your accountNumber"),
  accountType: z.nativeEnum(AccountType),
  ifscCode: z.string().nonempty("please enter your ifscCode"),
});

export const paymentRouter = createTRPCRouter({
  getPaymentDetails: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const paymentDetails = await prisma.payment.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return paymentDetails;
  }),

  getPurchases: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const purchases = await prisma.purchase.findMany({
      where: {
        creatorId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return purchases;
  }),

  getlastSevenDaysPurchases: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const purchases = await prisma.purchase.aggregate({
      where: {
        creatorId: ctx.session.user.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      _sum: {
        amount: true,
      },
    });

    return purchases._sum.amount;
  }),

  getBankDetails: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const bankDetails = await prisma.bankDetails.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return bankDetails;
  }),

  updateBankDetails: protectedProcedure
    .input(bankDetailZodObject)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const bankDetails = await prisma.bankDetails.upsert({
        where: {
          userId: ctx.session.user.id,
        },
        create: {
          userId: ctx.session.user.id,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          accountType: input.accountType,
          ifscCode: input.ifscCode,
        },
        update: {
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          accountType: input.accountType,
          ifscCode: input.ifscCode,
        },
      });

      return bankDetails;
    }),
});
