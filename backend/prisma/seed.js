import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      return;
    }

    // Create admin
    const hashedPassword = await bcrypt.hashSync('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@university.edu',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN'
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('==========================================');
    console.log('📧 Email: admin@university.edu');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMIN');
    console.log('==========================================');
    console.log('⚠️  Please change this password after first login!\n');

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
