 // src/server/api/root.ts

import { groupRouter } from "~/server/api/routers/group"; // 1. Import it
    // import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

    // export const appRouter = createTRPCRouter({
    //   group: groupRouter, // 2. Add it here
    // });

    // export type AppRouter = typeof appRouter;
    // export const createCaller = createCallerFactory(appRouter);

import { messageRouter } from "~/server/api/routers/message"; // 1. Import
import { eventRouter } from "~/server/api/routers/event"; // 1. Import
import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  group: groupRouter,
  message: messageRouter, // 2. Add
  event: eventRouter, // 2. Add
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
