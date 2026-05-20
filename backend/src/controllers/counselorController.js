import prisma from '../config/database.js';

/**
 * Get assigned students for the logged-in counselor
 * GET /api/counselor/my-students
 */
export const getMyAssignedStudents = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find the Counselor record linked to this user's email
        let counselor = await prisma.counselor.findUnique({
            where: { email: userEmail }
        });

        if (!counselor) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
                message: 'No counselor profile found for this user'
            });
        }

        // Get assigned students with their full profile
        const assignments = await prisma.counselorAssignment.findMany({
            where: {
                counselorId: counselor.id,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentId: true,
                        name: true,
                        email: true,
                        phone: true,
                        department: true,
                        semester: true,
                        currentCGPA: true,
                        attendancePercent: true,
                        dropoutRisk: true,
                        riskReason: true,
                        libraryVisits: true,
                        extracurricular: true,
                        disciplinaryIssues: true,
                        dateOfBirth: true,
                        gender: true
                    }
                }
            },
            orderBy: {
                student: {
                    dropoutRisk: 'asc' // HIGH first
                }
            }
        });

        const students = assignments.map(a => a.student);

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {
        console.error('Get my assigned students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assigned students',
            error: error.message
        });
    }
};

/**
 * Update student details (counselor can edit specific fields)
 * PUT /api/counselor/student/:id/details
 */
export const updateStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;
        const { phone, libraryVisits, extracurricular, disciplinaryIssues } = req.body;

        // Verify counselor has access to this student
        const counselor = await prisma.counselor.findUnique({
            where: { email: userEmail }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor profile not found'
            });
        }

        const assignment = await prisma.counselorAssignment.findFirst({
            where: {
                studentId: id,
                counselorId: counselor.id,
                status: 'ACTIVE'
            }
        });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this student'
            });
        }

        // Update allowed fields only
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (libraryVisits !== undefined) updateData.libraryVisits = parseInt(libraryVisits);
        if (extracurricular !== undefined) updateData.extracurricular = extracurricular;
        if (disciplinaryIssues !== undefined) updateData.disciplinaryIssues = parseInt(disciplinaryIssues);

        const updatedStudent = await prisma.student.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            data: updatedStudent,
            message: 'Student details updated successfully'
        });

    } catch (error) {
        console.error('Update student details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student details',
            error: error.message
        });
    }
};

/**
 * Add/update student marks
 * POST /api/counselor/student/:id/marks
 */
export const updateStudentMarks = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;
        const { subject, examType, marksObtained, totalMarks, date } = req.body;

        // Verify counselor has access to this student
        const counselor = await prisma.counselor.findUnique({
            where: { email: userEmail }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor profile not found'
            });
        }

        const assignment = await prisma.counselorAssignment.findFirst({
            where: {
                studentId: id,
                counselorId: counselor.id,
                status: 'ACTIVE'
            }
        });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this student'
            });
        }

        // Validate marks
        if (marksObtained > totalMarks) {
            return res.status(400).json({
                success: false,
                message: 'Marks obtained cannot exceed total marks'
            });
        }

        // Create assessment record
        const assessment = await prisma.assessment.create({
            data: {
                studentId: id,
                subject,
                examType,
                marksObtained: parseFloat(marksObtained),
                totalMarks: parseFloat(totalMarks),
                date: date ? new Date(date) : new Date()
            }
        });

        res.status(201).json({
            success: true,
            data: assessment,
            message: 'Marks added successfully'
        });

    } catch (error) {
        console.error('Update student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student marks',
            error: error.message
        });
    }
};

/**
 * Update student attendance
 * POST /api/counselor/student/:id/attendance
 */
export const updateStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;
        const { date, status, subject } = req.body;

        // Verify counselor has access to this student
        const counselor = await prisma.counselor.findUnique({
            where: { email: userEmail }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor profile not found'
            });
        }

        const assignment = await prisma.counselorAssignment.findFirst({
            where: {
                studentId: id,
                counselorId: counselor.id,
                status: 'ACTIVE'
            }
        });

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this student'
            });
        }

        // Create attendance record
        const attendance = await prisma.attendance.create({
            data: {
                studentId: id,
                date: date ? new Date(date) : new Date(),
                status: status || 'PRESENT',
                subject: subject || null
            }
        });

        res.status(201).json({
            success: true,
            data: attendance,
            message: 'Attendance recorded successfully'
        });

    } catch (error) {
        console.error('Update student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording attendance',
            error: error.message
        });
    }
};

/**
 * Get counselor statistics
 * GET /api/counselor/stats
 */
export const getCounselorStats = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const counselor = await prisma.counselor.findUnique({
            where: { email: userEmail },
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' },
                    include: {
                        student: {
                            select: {
                                dropoutRisk: true,
                                currentCGPA: true,
                                attendancePercent: true
                            }
                        }
                    }
                }
            }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor profile not found'
            });
        }

        const students = counselor.assignedStudents.map(a => a.student);
        const totalStudents = students.length;
        const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
        const mediumRisk = students.filter(s => s.dropoutRisk === 'MEDIUM').length;
        const lowRisk = students.filter(s => s.dropoutRisk === 'LOW').length;

        const avgCGPA = totalStudents > 0
            ? (students.reduce((acc, s) => acc + s.currentCGPA, 0) / totalStudents).toFixed(2)
            : 0;

        const avgAttendance = totalStudents > 0
            ? (students.reduce((acc, s) => acc + s.attendancePercent, 0) / totalStudents).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                highRisk,
                mediumRisk,
                lowRisk,
                avgCGPA: parseFloat(avgCGPA),
                avgAttendance: parseFloat(avgAttendance),
                maxStudents: counselor.maxStudents,
                capacityUsed: ((totalStudents / counselor.maxStudents) * 100).toFixed(1)
            }
        });

    } catch (error) {
        console.error('Get counselor stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching counselor statistics',
            error: error.message
        });
    }
};
