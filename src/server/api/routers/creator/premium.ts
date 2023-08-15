import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import Razorpay from "razorpay";
import shortid from "shortid";
import crypto from "crypto";
import { env } from "@/env.mjs";
import { premiumSubscriptionCharge } from "@/constants/values";
import { TRPCError } from "@trpc/server";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const premiumSubscriptionRouter = createTRPCRouter({
  createRazorpayOrder: protectedProcedure.mutation(async ({ ctx }) => {
    const { prisma } = ctx;

    const premiumSubscription = await prisma.premiumSubscription.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });

    if (premiumSubscription && premiumSubscription.endDate > new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already has a premium subscription",
      });
    }

    const options = {
      amount: (premiumSubscriptionCharge * 100).toString(),
      currency: "INR",
      receipt: shortid.generate(),
      payment_capture: 1,
      notes: {
        paymentFor: "preimum-subscription",
        userId: ctx.session.user.id,
      },
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      return {
        id: razorpayOrder.id,
        currency: razorpayOrder.currency,
        amount: razorpayOrder.amount,
      };
    } catch (err) {
      console.log(err);
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Couldn't create razorpay order",
      });
    }
  }),

  verifyPremiumPurchase: protectedProcedure
    .input(
      z.object({
        razorpay_payment_id: z.string(),
        razorpay_order_id: z.string(),
        razorpay_signature: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        input;
      const { prisma } = ctx;

      const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid signature",
        });
      }

      const premiumSubscription = await prisma.premiumSubscription.findUnique({
        where: {
          userId: ctx.session.user.id,
        },
      });

      if (premiumSubscription && premiumSubscription.endDate > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has a premium subscription",
        });
      }

      await prisma.premiumSubscription.create({
        data: {
          userId: ctx.session.user.id,
          startDate: new Date(),
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
        },
      });
    }),
});
