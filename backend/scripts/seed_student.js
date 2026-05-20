import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const studentId = '23dcs001';
        const email = '23dcs001@charusat.edu.in';
        const passwordHash = await bcrypt.hash(studentId, 10);

        const existingStudent = await prisma.student.findUnique({ where: { studentId } });
        if (existingStudent) {
            console.log(`✅ Student ${studentId} already exists!`);
            
            // Just update the password to ensure it matches
            await prisma.student.update({
                where: { studentId },
                data: { password: passwordHash }
            });
            console.log(`✅ Updated password for ${studentId}`);
            return;
        }

        const student = await prisma.student.create({
            data: {
                studentId,
                name: "Alex Dev",
                email,
                department: "Computer Science",
                semester: 5,
                attendancePercent: 86.5,
                currentCGPA: 8.4,
                dropoutRisk: "LOW",
                password: passwordHash
            }
        });

        console.log('\n✅ Dummy Student created successfully!');
        console.log('==========================================');
        console.log(`📧 Email/Username: ${student.email}`);
        console.log(`🔑 Password: ${studentId} (Your College ID)`);
        console.log('👤 Role: STUDENT');
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
