import prisma from '../config/database.js';

/**
 * Check current state of users and profiles
 */
async function checkProfiles() {
    try {
        console.log('📊 Checking current database state...\n');

        // Check all users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        console.log('👥 All Users:');
        allUsers.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        // Check counselors
        const counselors = await prisma.counselor.findMany({
            select: {
                id: true,
                email: true,
                name: true
            }
        });

        console.log('\n👨‍⚕️ Counselor Profiles:');
        if (counselors.length === 0) {
            console.log('   (none)');
        } else {
            counselors.forEach(c => {
                console.log(`   - ${c.name} (${c.email})`);
            });
        }

        // Check mentors
        const mentors = await prisma.mentor.findMany({
            select: {
                id: true,
                email: true,
                name: true
            }
        });

        console.log('\n👨‍🏫 Mentor Profiles:');
        if (mentors.length === 0) {
            console.log('   (none)');
        } else {
            mentors.forEach(m => {
                console.log(`   - ${m.name} (${m.email})`);
            });
        }

        // Find users without profiles
        console.log('\n⚠️  Users without matching profiles:');

        const counselorUsers = allUsers.filter(u => u.role === 'COUNSELOR');
        for (const user of counselorUsers) {
            const hasProfile = counselors.some(c => c.email === user.email);
            if (!hasProfile) {
                console.log(`   - COUNSELOR: ${user.name} (${user.email}) - MISSING PROFILE`);
            }
        }

        const mentorUsers = allUsers.filter(u => u.role === 'MENTOR');
        for (const user of mentorUsers) {
            const hasProfile = mentors.some(m => m.email === user.email);
            if (!hasProfile) {
                console.log(`   - MENTOR: ${user.name} (${user.email}) - MISSING PROFILE`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProfiles()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
