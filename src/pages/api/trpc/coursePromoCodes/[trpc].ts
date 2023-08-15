import { createTRPCContext } from "@/server/api/trpc";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "@/env.mjs";
import { promoCodeCourseRouter } from "@/server/api/routers/course/promo-code";

export default createNextApiHandler({
  router: promoCodeCourseRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
          );
        }
      : undefined,
});
