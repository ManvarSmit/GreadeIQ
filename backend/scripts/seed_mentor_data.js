
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedMentorData = async () => {
  const email = process.argv[2] || 'mentor@university.edu'; // Default or arg
  
  console.log(`🌱 Seeding mentor data for ${email}...`);

  try {
    // 1. Create/Get Mentor
    const mentor = await prisma.mentor.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: 'Senior Mentor',
        department: 'Computer Science',
        maxStudents: 20
      }
    });

    console.log(`✅ Mentor record ensured for ${email}`);

    // 2. Assign some students
    const students = await prisma.student.findMany({ 
      take: 5,
      // Check if not already assigned to THIS mentor
      // Ideally we check assignments but this is quick seed
    });

    if (students.length === 0) {
      console.log('⚠️ No students found to assign. Please upload student data first.');
      return;
    }

    for (const student of students) {
      // Check assignment
      const exists = await prisma.mentorAssignment.findFirst({
        where: { studentId: student.id, mentorId: mentor.id }
      });

      if (!exists) {
        await prisma.mentorAssignment.create({
          data: {
            studentId: student.id,
            mentorId: mentor.id,
            status: 'ACTIVE'
          }
        });
        console.log(`   Linked student ${student.name}`);
      }
    }

    console.log(`🎉 Mentor setup complete! Login as ${email} to see "My Students".`);

  } catch (error) {
    console.error('❌ Data seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedMentorData();
