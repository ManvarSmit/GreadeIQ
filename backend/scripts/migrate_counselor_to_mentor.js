import prisma from '../src/config/database.js';

async function migrateCounselorToMentor() {
  console.log('🚀 Starting Counselor-to-Mentor Data Migration...');

  try {
    // 1. Get all Counselor users
    const counselorUsers = await prisma.user.findMany({
      where: { role: 'COUNSELOR' }
    });
    console.log(`Found ${counselorUsers.length} users with role COUNSELOR`);

    // 2. Upsert each counselor as a Mentor in the mentors table
    const counselors = await prisma.counselor.findMany();
    console.log(`Found ${counselors.length} records in counselors table`);

    for (const c of counselors) {
      const mentor = await prisma.mentor.upsert({
        where: { email: c.email },
        update: {
          department: c.department || undefined,
          maxStudents: Math.max(c.maxStudents || 30, 20)
        },
        create: {
          name: c.name,
          email: c.email,
          department: c.department,
          specialization: 'Academic Mentorship & Counseling',
          maxStudents: c.maxStudents || 30
        }
      });
      console.log(`✅ Ensured Mentor profile for: ${mentor.email} (${mentor.name})`);
    }

    // Also ensure any counselor user without a counselor profile gets a mentor profile
    for (const u of counselorUsers) {
      await prisma.mentor.upsert({
        where: { email: u.email },
        update: {},
        create: {
          name: u.name,
          email: u.email,
          department: 'General Support',
          specialization: 'Academic Mentorship & Counseling',
          maxStudents: 30
        }
      });
    }

    // 3. Migrate all CounselorAssignments into MentorAssignments
    const counselorAssignments = await prisma.counselorAssignment.findMany({
      include: {
        counselor: true
      }
    });
    console.log(`Found ${counselorAssignments.length} counselor assignments to migrate`);

    let assignmentsMigrated = 0;
    for (const ca of counselorAssignments) {
      if (!ca.counselor) continue;
      const targetMentor = await prisma.mentor.findUnique({
        where: { email: ca.counselor.email }
      });

      if (targetMentor) {
        const existing = await prisma.mentorAssignment.findFirst({
          where: {
            studentId: ca.studentId,
            mentorId: targetMentor.id
          }
        });

        if (!existing) {
          await prisma.mentorAssignment.create({
            data: {
              studentId: ca.studentId,
              mentorId: targetMentor.id,
              status: ca.status || 'ACTIVE',
              assignedAt: ca.assignedAt || new Date()
            }
          });
          assignmentsMigrated++;
        }
      }
    }
    console.log(`✅ Migrated ${assignmentsMigrated} assignments to MentorAssignment`);

    // 4. Reassign Quizzes from counselorId to mentorId
    const quizzes = await prisma.quiz.findMany({
      where: { counselorId: { not: null } },
      include: { counselor: true }
    });
    console.log(`Found ${quizzes.length} quizzes created under counselorId`);

    for (const q of quizzes) {
      if (q.counselor) {
        const targetMentor = await prisma.mentor.findUnique({
          where: { email: q.counselor.email }
        });

        if (targetMentor) {
          await prisma.quiz.update({
            where: { id: q.id },
            data: {
              mentorId: targetMentor.id
            }
          });
          console.log(`✅ Reassigned quiz "${q.title}" to mentor ${targetMentor.email}`);
        }
      }
    }

    // 5. Reassign any counseling logs where counselorId was set
    const logs = await prisma.counselingLog.findMany({
      where: { counselorId: { not: null } }
    });
    console.log(`Found ${logs.length} counseling logs with counselorId`);

    for (const log of logs) {
      const counselor = await prisma.counselor.findUnique({
        where: { id: log.counselorId }
      });
      if (counselor) {
        const targetMentor = await prisma.mentor.findUnique({
          where: { email: counselor.email }
        });
        if (targetMentor) {
          await prisma.counselingLog.update({
            where: { id: log.id },
            data: { mentorId: targetMentor.id }
          });
        }
      }
    }

    // 6. Update user roles from COUNSELOR to MENTOR in users table
    const updateUsersResult = await prisma.user.updateMany({
      where: { role: 'COUNSELOR' },
      data: { role: 'MENTOR' }
    });
    console.log(`✅ Updated ${updateUsersResult.count} users from role COUNSELOR to MENTOR`);

    console.log('\n🎉 Counselor-to-Mentor data migration successfully finished!\n');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCounselorToMentor();
