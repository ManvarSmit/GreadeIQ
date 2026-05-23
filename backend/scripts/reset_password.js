import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const resetPassword = async () => {
  const email = process.argv[2];
  const newPassword = process.argv[3] || 'password123';

  if (!email) {
    console.log('❌ Error: Email is required.');
    console.log('Usage: node scripts/reset_password.js <email> [new_password]');
    process.exit(1);
  }

  try {
    // 1. Try to find in User model
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword, isTemporaryPassword: false }
      });
      console.log(`✅ Password successfully reset for User (Role: ${user.role})!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 New Password: ${newPassword}`);
      return;
    }

    // 2. Try to find in Student model
    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.student.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`✅ Password successfully reset for Student (${student.studentId})!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 New Password: ${newPassword}`);
      return;
    }

    console.log(`❌ Error: No user or student found with email: ${email}`);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
};

resetPassword();
