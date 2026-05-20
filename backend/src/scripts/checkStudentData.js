import prisma from '../config/database.js';

/**
 * Debug script to check student data
 */
async function checkStudentData() {
    try {
        console.log('📊 Checking student data in database...\n');

        // Get all students
        const students = await prisma.student.findMany({
            select: {
                id: true,
                studentId: true,
                name: true,
                department: true,
                semester: true
            }
        });

        console.log(`Total students in database: ${students.length}\n`);

        // Analyze data
        const withDept = students.filter(s => s.department).length;
        const withSem = students.filter(s => s.semester).length;

        console.log(`Students with department: ${withDept}`);
        console.log(`Students with semester: ${withSem}\n`);

        // Sample data
        console.log('📋 First 10 students:');
        students.slice(0, 10).forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.name} (${s.studentId}) | Dept: ${s.department} | Sem: ${s.semester}`);
        });

        // Get unique departments
        const uniqueDepts = [...new Set(students.map(s => s.department))];
        console.log(`\n🏢 Unique departments (${uniqueDepts.length}): ${uniqueDepts.join(', ')}`);

        // Get unique semesters
        const uniqueSems = [...new Set(students.map(s => s.semester))].sort((a, b) => a - b);
        console.log(`📚 Unique semesters: ${uniqueSems.join(', ')}`);

        // Check assignments
        const assignments = await prisma.counselorAssignment.findMany({
            where: { status: 'ACTIVE' }
        });
        console.log(`\n✅ Students already assigned: ${assignments.length}`);
        console.log(`🆓 Unassigned students: ${students.length - assignments.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudentData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
