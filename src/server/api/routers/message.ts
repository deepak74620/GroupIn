 import { z } from "zod";
    import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
    import { pusherServer } from "~/server/pusher";

    export const messageRouter = createTRPCRouter({
      // Query to get all messages for a specific group
      getAllByGroupId: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .query(({ ctx, input }) => {
          return ctx.db.message.findMany({
            where: { groupId: input.groupId },
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
            },
          });
        }),

      // Mutation to send a message
      send: protectedProcedure
        .input(
          z.object({
            groupId: z.string(),
            content: z.string().min(1),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const message = await ctx.db.message.create({
            data: {
              content: input.content,
              authorId: ctx.session.user.id,
              groupId: input.groupId,
            },
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
            },
          });

          // After saving to DB, trigger Pusher event
          await pusherServer.trigger(
            `group-${input.groupId}`, // Channel name
            "new-message", // Event name
            message, // The data payload
          );

          return message;
        }),
    });