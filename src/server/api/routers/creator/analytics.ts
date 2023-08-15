import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import creatorAnalytics from "@/helpers/creator-analytics";

const {
  getCoursePageViewed_analytics,
  getCourseBuyClicks_analytics,
  getCourseDetailsClicks_analytics,
  getProfileViewedData_analytics,
  getUniqueUserCoursePageViewedData_analytics,
  getUniqueUserCourseBuyClickedData_analytics,
  getUniqueUserCourseDetailsClickedData_analytics,
} = creatorAnalytics;

export const creatorAnalyticsRouter = createTRPCRouter({
  getCoursePageViewed: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const coursePageViewedData = await getCoursePageViewed_analytics(courseId)
        .then((res) => {
          return res;
        })
        .catch((err: Error) => {
          console.log({ err: err, message: err.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        });

      return coursePageViewedData;
    }),

  getCourseBuyClicks: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const courseBuyClicksData = await getCourseBuyClicks_analytics(courseId)
        .then((res) => {
          return res;
        })
        .catch((err: Error) => {
          console.log({ err: err, message: err.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        });
      return courseBuyClicksData;
    }),
  getCourseDetailsClicks: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const courseBuyClicksData = await getCourseDetailsClicks_analytics(
        courseId,
      )
        .then((res) => {
          return res;
        })
        .catch((err: Error) => {
          console.log({ err: err, message: err.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        });
      return courseBuyClicksData;
    }),
  getProfileViewedData: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        unique: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { creatorId, unique } = input;
      const creatorPageViewedData = await getProfileViewedData_analytics({
        creatorId,
        unique,
      })
        .then((res) => {
          return res;
        })
        .catch((err: Error) => {
          console.log({ err: err, message: err.message });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        });

      return creatorPageViewedData;
    }),
  getUniqueUserCoursePageViewedData: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const uniqueUserCoursePageViewedData =
        await getUniqueUserCoursePageViewedData_analytics(courseId)
          .then((res) => {
            return res;
          })
          .catch((err: Error) => {
            console.log({ err: err, message: err.message });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          });

      return uniqueUserCoursePageViewedData;
    }),
  getUniqueUserCourseBuyClickedData: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const uniqueUserCourseBuyClickedData =
        await getUniqueUserCourseBuyClickedData_analytics(courseId)
          .then((res) => {
            return res;
          })
          .catch((err: Error) => {
            console.log({ err: err, message: err.message });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          });

      return uniqueUserCourseBuyClickedData;
    }),
  getUniqueUserCourseDetailsClickedData: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseId } = input;
      const uniqueUserCourseDetailsClickedData =
        await getUniqueUserCourseDetailsClickedData_analytics(courseId)
          .then((res) => {
            return res;
          })
          .catch((err: Error) => {
            console.log({ err: err, message: err.message });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          });

      return uniqueUserCourseDetailsClickedData;
    }),
});
