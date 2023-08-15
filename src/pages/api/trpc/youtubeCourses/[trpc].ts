import { createTRPCContext } from "@/server/api/trpc";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "@/env.mjs";
import { youtubeCourseRouter } from "@/server/api/routers/course/youtube-course";

export default createNextApiHandler({
  router: youtubeCourseRouter,
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
