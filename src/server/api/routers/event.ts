import { z } from "zod";
    import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

    export const eventRouter = createTRPCRouter({
      // Query to get all events for a specific group
      getAllByGroupId: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .query(({ ctx, input }) => {
          return ctx.db.event.findMany({
            where: { groupId: input.groupId },
            orderBy: { date: "asc" }, // Show upcoming events first
            include: {
              createdBy: {
                select: { id: true, name: true },
              },
            },
          });
        }),

      // Mutation to create a new event
      create: protectedProcedure
        .input(
          z.object({
            groupId: z.string(),
            name: z.string().min(1, "Name is required"),
            description: z.string().optional(),
            date: z.date(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          // You might add a check here to ensure the user is a member of the group
          return ctx.db.event.create({
            data: {
              name: input.name,
              description: input.description,
              date: input.date,
              groupId: input.groupId,
              createdById: ctx.session.user.id,
            },
          });
        }),
    });