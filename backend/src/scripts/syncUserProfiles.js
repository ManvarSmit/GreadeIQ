import prisma from '../config/database.js';

/**
 * Sync script to create Counselor and Mentor profiles for existing users
 * Run this once to fix existing users without profiles
 */
async function syncUserProfiles() {
    try {
        console.log('🔄 Starting user profile sync...\n');

        // Find all COUNSELOR users
        const counselorUsers = await prisma.user.findMany({
            where: { role: 'COUNSELOR' }
        });

        console.log(`Found ${counselorUsers.length} counselor users`);

        // Create Counselor profiles for users without them
        let counselorsCreated = 0;
        for (const user of counselorUsers) {
            const existingProfile = await prisma.counselor.findUnique({
                where: { email: user.email }
            });

            if (!existingProfile) {
                await prisma.counselor.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        department: null,
                        maxStudents: 30
                    }
                });
                console.log(`✅ Created Counselor profile for: ${user.email}`);
                counselorsCreated++;
            } else {
                console.log(`⏭️  Counselor profile already exists for: ${user.email}`);
            }
        }

        // Find all MENTOR users
        const mentorUsers = await prisma.user.findMany({
            where: { role: 'MENTOR' }
        });

        console.log(`\nFound ${mentorUsers.length} mentor users`);

        // Create Mentor profiles for users without them
        let mentorsCreated = 0;
        for (const user of mentorUsers) {
            const existingProfile = await prisma.mentor.findUnique({
                where: { email: user.email }
            });

            if (!existingProfile) {
                await prisma.mentor.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        department: null
                    }
                });
                console.log(`✅ Created Mentor profile for: ${user.email}`);
                mentorsCreated++;
            } else {
                console.log(`⏭️  Mentor profile already exists for: ${user.email}`);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Counselor profiles created: ${counselorsCreated}`);
        console.log(`   Mentor profiles created: ${mentorsCreated}`);
        console.log('\n✅ Sync completed successfully!');

    } catch (error) {
        console.error('❌ Error syncing user profiles:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the sync
syncUserProfiles()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
