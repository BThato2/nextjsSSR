import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";

import Razorpay from "razorpay";
import shortid from "shortid";
import crypto from "crypto";
import { env } from "@/env.mjs";
import { paymentGatewayCharge } from "@/constants/values";
import { calculatePrice } from "@/components/CheckoutModal";
import { sendCoursePurchasedNotification } from "../../../helpers/emailHelper";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const enrollmentCourseRouter = createTRPCRouter({
  enroll: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const course = await prisma.course.findUnique({
        where: { id: input.courseId },
        include: { discount: true },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!course || !user) throw new TRPCError({ code: "BAD_REQUEST" });

      if (course.creatorId === user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      const price = calculatePrice({
        price: course?.price,
        permanentDiscount: course?.permanentDiscount,
        discount: course?.discount,
        promoDiscount: 0,
      });

      if (price > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not a free course",
        });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
        },
      });

      const audienceMember = await prisma.audienceMember.findFirst({
        where: {
          email: user.email,
          creatorId: course.creatorId ?? "",
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
            creatorId: course.creatorId ?? "",
            courseId: course.id,
          },
        });
      }

      return enrollment;
    }),

  createBuyCourseOrder: protectedProcedure
    .input(z.object({ courseId: z.string(), promoCode: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { courseId } = input;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          discount: true,
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!course || !user || !course.creatorId)
        throw new TRPCError({ code: "BAD_REQUEST" });

      if (course.creatorId === user.id)
        throw new TRPCError({ code: "BAD_REQUEST" });

      let promoDiscount = 0;
      const promoCode = input.promoCode
        ? await prisma.promoCode.findFirst({
            where: {
              code: input.promoCode,
              courseId: input.courseId,
            },
          })
        : undefined;

      if (promoCode && promoCode.active)
        promoDiscount = promoCode.discountPercent;

      const priceWithoutRoundoff = calculatePrice({
        price: course?.price,
        permanentDiscount: course?.permanentDiscount,
        discount: course?.discount,
        promoDiscount,
      });

      const course_price = parseFloat(
        (
          priceWithoutRoundoff +
          priceWithoutRoundoff * paymentGatewayCharge
        ).toFixed(2),
      );

      const payment_capture = 1;
      const amount = Math.ceil(course_price * 100);
      const currency = "INR";

      if (amount < 1) {
        // set the enrollment and purchase.

        await prisma.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
          },
        });

        const audienceMember = await prisma.audienceMember.findFirst({
          where: {
            email: user.email,
            creatorId: course.creatorId ?? "",
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
              creatorId: course.creatorId ?? "",
              courseId: course.id,
            },
          });
        }

        // Creating the purchase
        await prisma.purchase.create({
          data: {
            creatorId: course.creatorId,
            promoCode: input.promoCode ?? "",
            userId: ctx.session.user.id,
            productType: "COURSE",
            productId: course.id,
            amount,
          },
        });

        return;
      }

      const options = {
        amount: amount.toString(),
        currency,
        receipt: shortid.generate(),
        payment_capture,
        notes: {
          paymentFor: "course_purchase",
          userId: user.id,
          courseId: course.id,
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

  verifyCoursePurchase: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        promoCode: z.string().optional(),
        razorpay_payment_id: z.string(),
        razorpay_order_id: z.string(),
        razorpay_signature: z.string(),
        amount: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const {
        courseId,
        amount,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = input;

      const generated_signature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid signature",
        });
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          discount: true,
          creator: true,
        },
      });
      const user = await prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!user || !course || !course.creatorId)
        throw new TRPCError({ code: "BAD_REQUEST" });

      // Update Creator's Revenue
      await prisma.payment.upsert({
        where: {
          userId: course.creatorId,
        },
        update: {
          withdrawAmount: {
            increment: amount,
          },
          lifeTimeEarnings: {
            increment: amount,
          },
        },
        create: {
          userId: course.creatorId,
          withdrawAmount: amount,
          lifeTimeEarnings: amount,
        },
      });

      // Adding enrollment and updating audience list
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
        },
      });

      const audienceMember = await prisma.audienceMember.findFirst({
        where: {
          email: user.email,
          creatorId: course.creatorId ?? "",
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
            creatorId: course.creatorId ?? "",
            courseId: course.id,
          },
        });
      }

      // Creating the purchase
      await prisma.purchase.create({
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          creatorId: course.creatorId,
          promoCode: input.promoCode ?? "",
          userId: ctx.session.user.id,
          productType: "COURSE",
          productId: course.id,
          amount,
        },
      });
      await sendCoursePurchasedNotification({
        email: user.email,
        courseName: course.title,
        name: user.name,
        courseId: course.id,
        creatorProfile: course?.creator?.creatorProfile ?? "",
        creatorName: course?.creator?.name ?? "",
      });
    }),

  isEnrolled: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(({ ctx, input }) => {
      const { prisma } = ctx;

      if (!ctx.session) return null;

      const enrolled = prisma.enrollment.findFirst({
        where: {
          userId: ctx.session.user.id,
          courseId: input.courseId,
        },
      });

      return enrolled;
    }),

  getEnrollments: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                _count: {
                  select: {
                    chapters: true,
                    sections: true,
                    blocksChapters: true,
                  },
                },
                courseProgress: {
                  where: {
                    watchedById: ctx.session.user.id,
                  },
                  include: {
                    lastChapter: true,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const enrollments = user?.enrollments
      .map((er) => ({
        ...er,
        course: {
          ...er.course,
          courseProgress: er.course.courseProgress[0],
        },
      }))
      .filter((er) => er.course.creatorId !== ctx.session.user.id);

    return enrollments;
  }),

  getLastLearnedCourses: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const coursesProgresses = await prisma.courseProgress.findMany({
      where: {
        watchedById: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 2,
    });

    return coursesProgresses;
  }),
});
