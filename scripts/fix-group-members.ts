import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting script to fix group memberships...');

  const groups = await prisma.group.findMany({
    include: {
      members: {
        // --- THIS IS THE FIX ---
        // The field on the MembersOnGroups model is 'userId', not 'id'.
        select: { userId: true },
      },
    },
  });

  let fixedCount = 0;

  for (const group of groups) {
    const memberIds = group.members.map((member) => member.userId);
    
    if (!memberIds.includes(group.createdById)) {
      console.log(`Fixing group: "${group.name}" (ID: ${group.id})`);
      
      await prisma.group.update({
        where: { id: group.id },
        data: {
          members: {
            connectOrCreate: { // Use connectOrCreate for safety
                where: { userId_groupId: { userId: group.createdById, groupId: group.id } },
                create: { userId: group.createdById },
            },
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