import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const mentorPassHash = await bcrypt.hash('mentor123', 10);

    // 1. Admin
    await prisma.user.upsert({
      where: { email: 'admin@university.edu' },
      update: { isActive: true },
      create: {
        email: 'admin@university.edu',
        password: adminPassHash,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });

    // 2. Mentor
    await prisma.user.upsert({
      where: { email: 'mentor@university.edu' },
      update: { password: mentorPassHash, isActive: true },
      create: {
        email: 'mentor@university.edu',
        password: mentorPassHash,
        name: 'Senior Mentor',
        role: 'MENTOR',
        isActive: true
      }
    });

    await prisma.mentor.upsert({
      where: { email: 'mentor@university.edu' },
      update: {},
      create: {
        email: 'mentor@university.edu',
        name: 'Senior Mentor',
        department: 'Computer Science',
        maxStudents: 30
      }
    });

    console.log('\n✅ Demo Users Ready:');
    console.log('==========================================');
    console.log('👑 Admin:     admin@university.edu      / admin123');
    console.log('🧑‍🏫 Mentor:    mentor@university.edu     / mentor123');
    console.log('🎓 Student:   23dcs001@charusat.edu.in  / 23dcs001');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
