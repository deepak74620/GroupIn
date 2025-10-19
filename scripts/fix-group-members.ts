 import { PrismaClient } from '@prisma/client';

    const prisma = new PrismaClient();

    async function main() {
      console.log('Starting script to fix group memberships...');

      // 1. Find all groups and include their members' IDs
      const groups = await prisma.group.findMany({
        include: {
          members: {
            select: { id: true },
          },
        },
      });

      let fixedCount = 0;

      // 2. Loop through each group
      for (const group of groups) {
        const memberIds = group.members.map((member) => member.id);
        
        // 3. Check if the creator is already a member
        if (!memberIds.includes(group.createdById)) {
          console.log(`Fixing group: "${group.name}" (ID: ${group.id})`);
          
          // 4. If not, update the group to add the creator to the members list
          await prisma.group.update({
            where: { id: group.id },
            data: {
              members: {
                connect: { id: group.createdById },
              },
            },
          });
          fixedCount++;
        }
      }

      console.log(`Script finished. Fixed ${fixedCount} group(s).`);
    }

    main()
      .catch((e) => {
        console.error(e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });