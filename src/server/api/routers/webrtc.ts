// import { z } from "zod";
// import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
// import { pusherServer } from "~/server/pusher";



// export const webrtcRouter = createTRPCRouter({
//   sendSignal: protectedProcedure
//     .input(z.object({ groupId: z.string(), signal: z.any() }))
//     .mutation(async ({ ctx, input }) => {
//       await pusherServer.trigger(
//         `group-${input.groupId}`,
//         "webrtc-signal",
//         { senderId: ctx.session.user.id, signal: input.signal }
//       );
//       return { success: true };
//     }),
// });










import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { pusherServer } from "~/server/pusher";

export const webrtcRouter = createTRPCRouter({
  sendSignal: protectedProcedure
    .input(z.object({ groupId: z.string(), signal: z.record(z.unknown()) })) // FIX: Use record instead of any
    .mutation(async ({ ctx, input }) => {
      await pusherServer.trigger(
        `group-${input.groupId}`,
        "webrtc-signal",
        { senderId: ctx.session.user.id, signal: input.signal }
      );
      return { success: true };
    }),
});