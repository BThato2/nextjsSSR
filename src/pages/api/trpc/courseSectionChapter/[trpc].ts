import { createTRPCContext } from "@/server/api/trpc";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "@/env.mjs";
import { courseSectionChapterRouter } from "@/server/api/routers/course/section-chapter";

export default createNextApiHandler({
  router: courseSectionChapterRouter,
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
