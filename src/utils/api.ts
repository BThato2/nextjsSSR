/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import {
  type TRPCClientRuntime,
  httpBatchLink,
  loggerLink,
  splitLink,
  type TRPCClientErrorLike,
} from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import {
  type Maybe,
  type inferRouterInputs,
  type inferRouterOutputs,
} from "@trpc/server";
import superjson from "superjson";

import { type AppRouter } from "@/server/api/root";

const ROUTERS: string[] = [
  "course",
  "youtubeCourses",
  "courseChapter",
  "courseEdit",
  "courseSection",
  "courseSectionChapter",
  "courseFeedback",
  "courseTags",
  "courseCategories",
  "coursePromoCodes",
  "courseSuggestions",
  "courseEnrollment",
  "tracking",
  "youTubeAPI",
  "event",
  "eventFeedback",
  "eventHost",
  "payment",
  "creator",
  "premiumSubscription",
  "creatorAnalytics",
  "emailReminder",
  "emailSender",
  "email",
  "testimonial",
  "askedQuery",
  "contact",
];

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

const resolveEndpoint = (runtime: TRPCClientRuntime) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const parts: string[] = ctx.op.path.split(".");

    const splittedPath = ROUTERS.find((router) => router === parts[0]);

    if (splittedPath)
      return httpBatchLink({ url: `${getBaseUrl()}/api/trpc/${splittedPath}` })(
        runtime,
      )(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        { ...ctx, op: { ...ctx.op, path: parts.slice(1).join(".") } },
      );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return httpBatchLink({ url: `${getBaseUrl()}/api/trpc` })(runtime)(ctx);
    }
  };
};

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        // httpBatchLink({
        //   url: `${getBaseUrl()}/api/trpc`,
        // }),
        splitLink({
          // check for context property `skipBatch`
          condition: () => true,
          // when condition is true, use normal request
          true: (runtime) => {
            return resolveEndpoint(runtime);
          },
          // when condition is false, use batch request
          false: (runtime) => {
            return resolveEndpoint(runtime);
          },
        }),
      ],

      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 1000,
          },
          retry(failureCount: number, error: unknown) {
            const err = error as never as Maybe<TRPCClientErrorLike<AppRouter>>;
            const code = err?.data?.code;
            if (
              code === "BAD_REQUEST" ||
              code === "FORBIDDEN" ||
              code === "UNAUTHORIZED"
            )
              return false;

            const MAX_QUERY_RETRIES = 3;
            return failureCount < MAX_QUERY_RETRIES;
          },
        },
      },
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
