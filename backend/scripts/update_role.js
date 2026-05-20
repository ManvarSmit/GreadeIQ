
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updateRole = async () => {
  const email = process.argv[2];
  const newRole = process.argv[3];

  if (!email || !newRole) {
    console.log('Usage: node scripts/update_role.js <email> <role>');
    console.log('Roles: ADMIN, MENTOR, COUNSELOR');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: newRole.toUpperCase() }
    });

    console.log(`✅ User ${email} role updated to ${user.role}`);
  } catch (error) {
    console.error('❌ Error updating role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

updateRole();
