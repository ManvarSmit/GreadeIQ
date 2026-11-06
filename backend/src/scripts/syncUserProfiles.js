import prisma from '../config/database.js';

/**
 * Sync script to create Mentor profiles for existing mentor users
 */
async function syncUserProfiles() {
    try {
        console.log('🔄 Starting user profile sync...\n');

        // Find all MENTOR users
        const mentorUsers = await prisma.user.findMany({
            where: { role: 'MENTOR' }
        });

        console.log(`Found ${mentorUsers.length} mentor users`);

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
