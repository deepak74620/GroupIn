 import { z } from "zod";

    import {
      createTRPCRouter,
      protectedProcedure,
       // We will use this to ensure only logged-in users can create groups
      publicProcedure,
    } from "~/server/api/trpc";

    // export const groupRouter = createTRPCRouter({
    //   // Procedure to create a new group
    //   create: protectedProcedure
    //     .input(z.object({ name: z.string().min(1) }))
    //     .mutation(async ({ ctx, input }) => {
    //       // ctx.session.user is available because we used protectedProcedure
    //       return ctx.db.group.create({
    //         data: {
    //           name: input.name,
    //           createdBy: { connect: { id: ctx.session.user.id } },
    //         },
    //       });
    //     }),

    //   // Procedure to get all existing groups
    //   getAll: publicProcedure.query(({ ctx }) => {
    //     return ctx.db.group.findMany({
    //       orderBy: { createdAt: "desc" },
    //     });
    //   }),
    // });



    export const groupRouter = createTRPCRouter({
      // --- NEW PROCEDURE ---
      getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
          return await ctx.db.group.findUnique({
            where: { id: input.id },
            include: {
              members: {
                select: { id: true, name: true, image: true },
              },
              createdBy: {
                select: { name: true },
              },
            },
          });
        }),


      // Existing 'create' procedure...
      create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          // 1. When creating a group, automatically add the creator as a member.
          return ctx.db.group.create({
            data: {
              name: input.name,
              createdBy: { connect: { id: ctx.session.user.id } },
              members: { connect: { id: ctx.session.user.id } }, // Add creator to members
            },
          });
        }),

      // Existing 'getAll' procedure...
      // --- MODIFY THIS PROCEDURE ---
      getAll: protectedProcedure.query(({ ctx }) => { // 1. Change to protectedProcedure
        // 2. Add a 'where' clause to filter by the current user's ID
        return ctx.db.group.findMany({
          where: {
            members: {
              some: {
                id: ctx.session.user.id,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            members: {
              select: { id: true, name: true, image: true },
            },
            createdBy: {
              select: { name: true, id: true }, // Also include createdBy ID
            }
          }
        });
      }),

      // New Procedure: Join a Group
      join: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return ctx.db.group.update({
            where: { id: input.groupId },
            data: {
              members: { connect: { id: ctx.session.user.id } },
            },
          });
        }),

      // New Procedure: Leave a Group
      leave: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return ctx.db.group.update({
            where: { id: input.groupId },
            data: {
              members: { disconnect: { id: ctx.session.user.id } },
            },
          });
        }),


        // --- NEW PROCEDURES ---

      // Creates a new, unique invite code for a group
      createInvite: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          // In the future, we will add an admin check here
          const group = await ctx.db.group.findUnique({ where: { id: input.groupId } });
          if (group?.createdById !== ctx.session.user.id) {
            throw new Error("Only the creator can generate invite links.");
          }
          
          const invite = await ctx.db.groupInvite.create({
            data: {
              groupId: input.groupId,
            },
          });
          return invite;
        }),

      // Gets info about an invite link (e.g., what group is it for?)
      getInviteInfo: publicProcedure
        .input(z.object({ inviteId: z.string() }))
        .query(({ ctx, input }) => {
          return ctx.db.groupInvite.findUnique({
            where: { id: input.inviteId },
            include: {
              group: {
                select: { name: true, createdBy: { select: { name: true } } },
              },
            },
          });
        }),

      // Accepts an invite and adds the user to the group
      acceptInvite: protectedProcedure
        .input(z.object({ inviteId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const invite = await ctx.db.groupInvite.findUnique({
            where: { id: input.inviteId },
          });

          if (!invite) {
            throw new Error("Invite not found or has expired.");
          }

          // Add user to the group
          await ctx.db.group.update({
            where: { id: invite.groupId },
            data: {
              members: { connect: { id: ctx.session.user.id } },
            },
          });

          // Delete the invite so it can't be used again
          await ctx.db.groupInvite.delete({ where: { id: input.inviteId } });
          
          return { groupId: invite.groupId };
        }),
    });