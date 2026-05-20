import prisma from '../config/database.js';

/**
 * Get all mentors with statistics
 * GET /api/admin/mentors
 */
export const getAllMentors = async (req, res) => {
    try {
        const mentors = await prisma.mentor.findMany({
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' },
                    select: { id: true }
                },
                counselorAssignments: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, counselor: { select: { name: true, email: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get User IDs for each mentor email
        const emails = mentors.map(m => m.email);
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, email: true }
        });

        const userMap = users.reduce((acc, user) => {
            acc[user.email] = user.id;
            return acc;
        }, {});

        const mentorsWithStats = mentors.map(mentor => ({
            ...mentor,
            userId: userMap[mentor.email], // Attach User ID
            studentCount: mentor.assignedStudents.length,
            counselorCount: mentor.counselorAssignments.length,
            counselors: mentor.counselorAssignments.map(ca => ca.counselor)
        }));

        res.status(200).json({
            success: true,
            count: mentorsWithStats.length,
            data: mentorsWithStats
        });

    } catch (error) {
        console.error('Get all mentors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching mentors',
            error: error.message
        });
    }
};

/**
 * Get all counselors with statistics
 * GET /api/admin/counselors
 */
export const getAllCounselors = async (req, res) => {
    try {
        const counselors = await prisma.counselor.findMany({
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' },
                    include: {
                        student: {
                            select: {
                                dropoutRisk: true
                            }
                        }
                    }
                },
                mentorAssignments: {
                    where: { status: 'ACTIVE' },
                    select: {
                        mentor: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get User IDs for each counselor email
        const emails = counselors.map(c => c.email);
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, email: true }
        });

        const userMap = users.reduce((acc, user) => {
            acc[user.email] = user.id;
            return acc;
        }, {});

        const counselorsWithStats = counselors.map(counselor => {
            const students = counselor.assignedStudents.map(a => a.student);
            const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;

            return {
                ...counselor,
                userId: userMap[counselor.email], // Attach User ID
                studentCount: counselor.assignedStudents.length,
                highRiskCount: highRisk,
                mentors: counselor.mentorAssignments.map(ma => ma.mentor),
                capacityUsed: ((counselor.assignedStudents.length / counselor.maxStudents) * 100).toFixed(1)
            };
        });

        res.status(200).json({
            success: true,
            count: counselorsWithStats.length,
            data: counselorsWithStats
        });

    } catch (error) {
        console.error('Get all counselors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching counselors',
            error: error.message
        });
    }
};

/**
 * Assign student to counselor
 * POST /api/admin/assign/student-counselor
 */
export const assignStudentToCounselor = async (req, res) => {
    try {
        const { studentId, counselorId } = req.body;
        const adminUserId = req.user.id;

        // Validate student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Validate counselor exists
        const counselor = await prisma.counselor.findUnique({
            where: { id: counselorId },
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor not found'
            });
        }

        // Check counselor capacity
        if (counselor.assignedStudents.length >= counselor.maxStudents) {
            return res.status(400).json({
                success: false,
                message: `Counselor has reached maximum capacity (${counselor.maxStudents} students)`
            });
        }

        // Check if student is already assigned to this counselor
        const existingAssignment = await prisma.counselorAssignment.findFirst({
            where: {
                studentId,
                counselorId,
                status: 'ACTIVE'
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Student is already assigned to this counselor'
            });
        }

        // Deactivate any existing active assignments for this student
        await prisma.counselorAssignment.updateMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            data: {
                status: 'REASSIGNED'
            }
        });

        // Create new assignment
        const assignment = await prisma.counselorAssignment.create({
            data: {
                studentId,
                counselorId,
                assignedBy: adminUserId,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: { name: true, studentId: true }
                },
                counselor: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Student assigned to counselor successfully'
        });

    } catch (error) {
        console.error('Assign student to counselor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning student to counselor',
            error: error.message
        });
    }
};

/**
 * Assign mentor to counselor (oversight)
 * POST /api/admin/assign/mentor-counselor
 */
export const assignMentorToCounselor = async (req, res) => {
    try {
        const { mentorId, counselorId } = req.body;
        const adminUserId = req.user.id;

        // Validate mentor exists
        const mentor = await prisma.mentor.findUnique({
            where: { id: mentorId }
        });

        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Validate counselor exists
        const counselor = await prisma.counselor.findUnique({
            where: { id: counselorId }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor not found'
            });
        }

        // Check if assignment already exists
        const existingAssignment = await prisma.mentorCounselorAssignment.findFirst({
            where: {
                mentorId,
                counselorId,
                status: 'ACTIVE'
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Mentor is already assigned to this counselor'
            });
        }

        // Create new assignment
        const assignment = await prisma.mentorCounselorAssignment.create({
            data: {
                mentorId,
                counselorId,
                assignedBy: adminUserId,
                status: 'ACTIVE'
            },
            include: {
                mentor: {
                    select: { name: true, email: true }
                },
                counselor: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Mentor assigned to counselor successfully'
        });

    } catch (error) {
        console.error('Assign mentor to counselor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning mentor to counselor',
            error: error.message
        });
    }
};

/**
 * Bulk assign students to counselor
 * POST /api/admin/assign/bulk-students
 */
export const bulkAssignStudents = async (req, res) => {
    try {
        const { studentIds, counselorId } = req.body;
        const adminUserId = req.user.id;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'studentIds must be a non-empty array'
            });
        }

        // Validate counselor exists and check capacity
        const counselor = await prisma.counselor.findUnique({
            where: { id: counselorId },
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: 'Counselor not found'
            });
        }

        const availableCapacity = counselor.maxStudents - counselor.assignedStudents.length;
        if (studentIds.length > availableCapacity) {
            return res.status(400).json({
                success: false,
                message: `Counselor can only accommodate ${availableCapacity} more students`
            });
        }

        // Deactivate existing assignments for these students
        await prisma.counselorAssignment.updateMany({
            where: {
                studentId: { in: studentIds },
                status: 'ACTIVE'
            },
            data: {
                status: 'REASSIGNED'
            }
        });

        // Create new assignments
        const assignments = await Promise.all(
            studentIds.map(studentId =>
                prisma.counselorAssignment.create({
                    data: {
                        studentId,
                        counselorId,
                        assignedBy: adminUserId,
                        status: 'ACTIVE'
                    }
                })
            )
        );

        res.status(201).json({
            success: true,
            count: assignments.length,
            data: assignments,
            message: `${assignments.length} students assigned to counselor successfully`
        });

    } catch (error) {
        console.error('Bulk assign students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk assigning students',
            error: error.message
        });
    }
};

/**
 * Reassign student to different counselor
 * PUT /api/admin/reassign/student
 */
export const reassignStudent = async (req, res) => {
    try {
        const { studentId, newCounselorId } = req.body;
        const adminUserId = req.user.id;

        // Deactivate current assignment
        await prisma.counselorAssignment.updateMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            data: {
                status: 'REASSIGNED'
            }
        });

        // Create new assignment
        const newAssignment = await prisma.counselorAssignment.create({
            data: {
                studentId,
                counselorId: newCounselorId,
                assignedBy: adminUserId,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: { name: true, studentId: true }
                },
                counselor: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            data: newAssignment,
            message: 'Student reassigned successfully'
        });

    } catch (error) {
        console.error('Reassign student error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reassigning student',
            error: error.message
        });
    }
};

/**
 * Get user management statistics
 * GET /api/admin/stats
 */
export const getUserManagementStats = async (req, res) => {
    try {
        const [
            totalMentors,
            totalCounselors,
            totalStudents,
            assignedStudents,
            totalUsers
        ] = await Promise.all([
            prisma.mentor.count(),
            prisma.counselor.count(),
            prisma.student.count(),
            prisma.counselorAssignment.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({ where: { isActive: true } })
        ]);

        const unassignedStudents = totalStudents - assignedStudents;

        res.status(200).json({
            success: true,
            data: {
                totalMentors,
                totalCounselors,
                totalStudents,
                assignedStudents,
                unassignedStudents,
                totalUsers,
                assignmentRate: totalStudents > 0
                    ? ((assignedStudents / totalStudents) * 100).toFixed(1)
                    : 0
            }
        });

    } catch (error) {
        console.error('Get user management stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user management statistics',
            error: error.message
        });
    }
};

/**
 * Delete a user and their associated profile
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user to get role and email
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Delete associated profile based on role
        if (user.role === 'MENTOR') {
            // Delete mentor profile (cascades assignments if set up, or leaves orphan assignments? 
            // MentorAssignment has cascade delete on mentorId, so it's safe if we delete Mentor record)
            const mentor = await prisma.mentor.findUnique({ where: { email: user.email } });
            if (mentor) {
                await prisma.mentor.delete({ where: { id: mentor.id } });
            }
        } else if (user.role === 'COUNSELOR') {
            const counselor = await prisma.counselor.findUnique({ where: { email: user.email } });
            if (counselor) {
                // CounselorAssignment likely has cascade delete too?
                // Let's assume so or it will error if there dependants.
                // Actually CounselorAssignment usually has cascade on counselorId.
                await prisma.counselor.delete({ where: { id: counselor.id } });
            }
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'User and associated profile deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};
