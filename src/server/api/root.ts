import { createTRPCRouter } from "@/server/api/trpc";
import { paymentRouter } from "./routers/creator/payments";
import { creatorRouter } from "@/server/api/routers/creator/creator";
import { eventRouter } from "./routers/event/event";
import { emailSenderRouter } from "./email/email-sender";
import { testimonialRouter } from "./routers/testimonial";
import { feedbacksRouter } from "./routers/event/feedback";
import { hostRouter } from "./routers/event/host";
import { courseChapterRouter } from "./routers/course/chapter";
import { emailRouter } from "./email/email";
import { courseFeedbacksRouter } from "./routers/course/feedback";
import { contactRouter } from "./routers/contact";
import { askedQueryRouter } from "./routers/askedQuery";
import { trackingRouter } from "./routers/course/tracking";
import { youTubeAPIRouter } from "./routers/course/youtube-api";
import { tagsCourseRouter } from "./routers/course/tags";
import { categoriesCourseRouter } from "./routers/course/categories";
import { enrollmentCourseRouter } from "./routers/course/enrollment";
import { suggestionCourseRouter } from "./routers/course/suggestions";
import { dailyReminderRouter } from "./routers/reminders/daily";
import { cronTestRouter } from "./cront-test";
import { promoCodeCourseRouter } from "./routers/course/promo-code";
import { creatorAnalyticsRouter } from "./routers/creator/analytics";
import { youtubeCourseRouter } from "./routers/course/youtube-course";
import { courseSectionRouter } from "./routers/course/sections";
import { courseEditRouter } from "./routers/course/course-edit";
import { premiumSubscriptionRouter } from "./routers/creator/premium";
import { courseSectionChapterRouter } from "./routers/course/section-chapter";
import { courseRouter } from "./routers/course/course";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // splitted
  course: courseRouter,
  youtubeCourses: youtubeCourseRouter,
  courseChapter: courseChapterRouter,
  courseEdit: courseEditRouter,
  courseSection: courseSectionRouter,
  courseSectionChapter: courseSectionChapterRouter,

  courseFeedback: courseFeedbacksRouter,
  courseTags: tagsCourseRouter,
  courseCategories: categoriesCourseRouter,
  coursePromoCodes: promoCodeCourseRouter,
  courseSuggestions: suggestionCourseRouter,
  courseEnrollment: enrollmentCourseRouter,
  tracking: trackingRouter,
  youTubeAPI: youTubeAPIRouter,

  event: eventRouter,
  eventFeedback: feedbacksRouter,
  eventHost: hostRouter,

  payment: paymentRouter,
  creator: creatorRouter,
  premiumSubscription: premiumSubscriptionRouter,
  creatorAnalytics: creatorAnalyticsRouter,

  emailReminder: dailyReminderRouter,

  emailSender: emailSenderRouter,
  email: emailRouter,

  testimonial: testimonialRouter,

  askedQuery: askedQueryRouter,

  contact: contactRouter,

  // not splitted
  cronEmailTesting: cronTestRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
