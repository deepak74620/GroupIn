//  import { z } from "zod";

//     import {
//       createTRPCRouter,
//       protectedProcedure,
//        // We will use this to ensure only logged-in users can create groups
//       publicProcedure,
//     } from "~/server/api/trpc";

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













    // export const groupRouter = createTRPCRouter({
    //   // --- NEW PROCEDURE ---
    //   getById: publicProcedure
    //     .input(z.object({ id: z.string() }))
    //     .query(async ({ ctx, input }) => {
    //       return await ctx.db.group.findUnique({
    //         where: { id: input.id },
    //         include: {
    //           members: {
    //             select: { id: true, name: true, image: true },
    //           },
    //           createdBy: {
    //             select: { name: true },
    //           },
    //         },
    //       });
    //     }),


    //   // Existing 'create' procedure...
    //   create: protectedProcedure
    //     .input(z.object({ name: z.string().min(1) }))
    //     .mutation(async ({ ctx, input }) => {
    //       // 1. When creating a group, automatically add the creator as a member.
    //       return ctx.db.group.create({
    //         data: {
    //           name: input.name,
    //           createdBy: { connect: { id: ctx.session.user.id } },
    //           members: { connect: { id: ctx.session.user.id } }, // Add creator to members
    //         },
    //       });
    //     }),

    //   // Existing 'getAll' procedure...
    //   // --- MODIFY THIS PROCEDURE ---
    //   getAll: protectedProcedure.query(({ ctx }) => { // 1. Change to protectedProcedure
    //     // 2. Add a 'where' clause to filter by the current user's ID
    //     return ctx.db.group.findMany({
    //       where: {
    //         members: {
    //           some: {
    //             id: ctx.session.user.id,
    //           },
    //         },
    //       },
    //       orderBy: { createdAt: "desc" },
    //       include: {
    //         members: {
    //           select: { id: true, name: true, image: true },
    //         },
    //         createdBy: {
    //           select: { name: true, id: true }, // Also include createdBy ID
    //         }
    //       }
    //     });
    //   }),

    //   // New Procedure: Join a Group
    //   join: protectedProcedure
    //     .input(z.object({ groupId: z.string() }))
    //     .mutation(async ({ ctx, input }) => {
    //       return ctx.db.group.update({
    //         where: { id: input.groupId },
    //         data: {
    //           members: { connect: { id: ctx.session.user.id } },
    //         },
    //       });
    //     }),

    //   // New Procedure: Leave a Group
    //   leave: protectedProcedure
    //     .input(z.object({ groupId: z.string() }))
    //     .mutation(async ({ ctx, input }) => {
    //       return ctx.db.group.update({
    //         where: { id: input.groupId },
    //         data: {
    //           members: { disconnect: { id: ctx.session.user.id } },
    //         },
    //       });
    //     }),


    //     // --- NEW PROCEDURES ---

      // // Creates a new, unique invite code for a group
      // createInvite: protectedProcedure
      //   .input(z.object({ groupId: z.string() }))
      //   .mutation(async ({ ctx, input }) => {
      //     // In the future, we will add an admin check here
      //     const group = await ctx.db.group.findUnique({ where: { id: input.groupId } });
      //     if (group?.createdById !== ctx.session.user.id) {
      //       throw new Error("Only the creator can generate invite links.");
      //     }
          
      //     const invite = await ctx.db.groupInvite.create({
      //       data: {
      //         groupId: input.groupId,
      //       },
      //     });
      //     return invite;
      //   }),

      // // Gets info about an invite link (e.g., what group is it for?)
      // getInviteInfo: publicProcedure
      //   .input(z.object({ inviteId: z.string() }))
      //   .query(({ ctx, input }) => {
      //     return ctx.db.groupInvite.findUnique({
      //       where: { id: input.inviteId },
      //       include: {
      //         group: {
      //           select: { name: true, createdBy: { select: { name: true } } },
      //         },
      //       },
      //     });
      //   }),

    //   // Accepts an invite and adds the user to the group
    //   acceptInvite: protectedProcedure
    //     .input(z.object({ inviteId: z.string() }))
    //     .mutation(async ({ ctx, input }) => {
    //       const invite = await ctx.db.groupInvite.findUnique({
    //         where: { id: input.inviteId },
    //       });

    //       if (!invite) {
    //         throw new Error("Invite not found or has expired.");
    //       }

    //       // Add user to the group
    //       await ctx.db.group.update({
    //         where: { id: invite.groupId },
    //         data: {
    //           members: { connect: { id: ctx.session.user.id } },
    //         },
    //       });

    //       // Delete the invite so it can't be used again
    //       await ctx.db.groupInvite.delete({ where: { id: input.inviteId } });
          
    //       return { groupId: invite.groupId };
    //     }),
    // });










  import { z } from "zod";
    import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
    
    export const groupRouter = createTRPCRouter({
      // --- UPDATE: Create procedure ---
      create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
          return ctx.db.group.create({
            data: {
              name: input.name,
              createdBy: { connect: { id: ctx.session.user.id } },
              // Now we create an entry in our new junction table
              members: {
                create: {
                  userId: ctx.session.user.id,
                  // The creator is an admin by default!
                  isAdmin: true, 
                },
              },
            },
          });
        }),

      // --- UPDATE: Join procedure ---
      join: protectedProcedure
        .input(z.object({ groupId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return ctx.db.group.update({
            where: { id: input.groupId },
            data: {
              // Create an entry in the junction table, default isAdmin is false
              members: {
                create: {
                  userId: ctx.session.user.id,
                },
              },
            },
          });
        }),

      // --- UPDATE: Leave procedure ---
      leave: protectedProcedure
      .input(z.object({ groupId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // --- ADD THIS CHECK ---
        // First, find the group to check who the creator is.
        const group = await ctx.db.group.findUnique({
          where: { id: input.groupId },
        });

        // If the person trying to leave is the creator, throw an error.
        if (group?.createdById === ctx.session.user.id) {
          throw new Error(
            "The group creator cannot leave the group. You must delete it instead."
          );
        }
        // --- END OF CHECK ---

        // If the check passes, proceed with deleting the membership link.
        return ctx.db.membersOnGroups.delete({
          where: {
            userId_groupId: {
              userId: ctx.session.user.id,
              groupId: input.groupId,
            },
          },
        });
      }),
      
      // --- UPDATE: getAll and getById to handle the new structure ---
      getAll: protectedProcedure.query(({ ctx }) => {
        return ctx.db.group.findMany({
          where: { members: { some: { userId: ctx.session.user.id } } },
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { name: true, id: true } } },
        });
      }),

      getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
          return await ctx.db.group.findUnique({
            where: { id: input.id },
            include: {
              createdBy: { select: { name: true } },
              // This is a nested include to get the full user details for each member
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, image: true },
                  },
                },
              },
            },
          });
        }),

      // --- NEW: Procedures for Admin Management ---
      promoteToAdmin: protectedProcedure
        .input(z.object({ groupId: z.string(), memberId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const group = await ctx.db.group.findUnique({ where: { id: input.groupId } });
          if (group?.createdById !== ctx.session.user.id) {
            throw new Error("Only the group creator can promote admins.");
          }
          return ctx.db.membersOnGroups.update({
            where: { userId_groupId: { userId: input.memberId, groupId: input.groupId } },
            data: { isAdmin: true },
          });
        }),

      demoteFromAdmin: protectedProcedure
        .input(z.object({ groupId: z.string(), memberId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const group = await ctx.db.group.findUnique({ where: { id: input.groupId } });
          if (group?.createdById !== ctx.session.user.id) {
            throw new Error("Only the group creator can demote admins.");
          }
          if (group?.createdById === input.memberId) {
            throw new Error("The group creator cannot be demoted.");
          }
          return ctx.db.membersOnGroups.update({
            where: { userId_groupId: { userId: input.memberId, groupId: input.groupId } },
            data: { isAdmin: false },
          });
        }),

      // ... (acceptInvite, createInvite, getInviteInfo are mostly unchanged but will benefit from this structure)
      // We'll update acceptInvite to use the new logic
      acceptInvite: protectedProcedure
        .input(z.object({ inviteId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const invite = await ctx.db.groupInvite.findUnique({ where: { id: input.inviteId } });
          if (!invite) throw new Error("Invite not found or has expired.");
          
          await ctx.db.group.update({
            where: { id: invite.groupId },
            data: {
              members: { create: { userId: ctx.session.user.id } },
            },
          });
          await ctx.db.groupInvite.delete({ where: { id: input.inviteId } });
          return { groupId: invite.groupId };
        }),
        
      // Other procedures...
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
    });