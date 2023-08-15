import { createTRPCContext } from "@/server/api/trpc";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "@/env.mjs";
import { contactRouter } from "@/server/api/routers/contact";

export default createNextApiHandler({
  router: contactRouter,
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
