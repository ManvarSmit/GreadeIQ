import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import authConfig from '../config/auth.js';
import logger from '../utils/logger.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

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
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentId: true,
                                name: true,
                                dropoutRisk: true,
                                currentCGPA: true,
                                attendancePercent: true
                            }
                        }
                    }
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

        const maxCapacity = 30;

        const mentorsWithStats = mentors.map(mentor => {
            const students = mentor.assignedStudents.map(a => a.student);
            const highRisk = students.filter(s => s && s.dropoutRisk === 'HIGH').length;

            return {
                ...mentor,
                userId: userMap[mentor.email], // Attach User ID
                studentCount: students.length,
                highRiskCount: highRisk,
                maxStudents: maxCapacity,
                capacityUsed: ((students.length / maxCapacity) * 100).toFixed(1)
            };
        });

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
 * Assign student to mentor
 * POST /api/admin/assign/student-mentor
 */
export const assignStudentToMentor = async (req, res) => {
    try {
        const { studentId, mentorId } = req.body;
        const targetMentorId = mentorId;
        const adminUserId = req.user.id;

        if (!studentId || !targetMentorId) {
            return res.status(400).json({
                success: false,
                message: 'Both studentId and mentorId are required'
            });
        }

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

        // Validate mentor exists
        const mentor = await prisma.mentor.findUnique({
            where: { id: targetMentorId },
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Check mentor capacity (default: 30)
        const maxCapacity = 30;
        if (mentor.assignedStudents.length >= maxCapacity) {
            return res.status(400).json({
                success: false,
                message: `Mentor has reached maximum capacity (${maxCapacity} students)`
            });
        }

        // Check if student is already assigned to this mentor
        const existingAssignment = await prisma.mentorAssignment.findFirst({
            where: {
                studentId,
                mentorId: targetMentorId,
                status: 'ACTIVE'
            }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Student is already assigned to this mentor'
            });
        }

        // Deactivate any existing active assignments for this student
        await prisma.mentorAssignment.updateMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            data: {
                status: 'REASSIGNED'
            }
        });

        // Create new assignment
        const assignment = await prisma.mentorAssignment.create({
            data: {
                studentId,
                mentorId: targetMentorId,
                assignedBy: adminUserId,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: { name: true, studentId: true }
                },
                mentor: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: assignment,
            message: 'Student assigned to mentor successfully'
        });

    } catch (error) {
        console.error('Assign student to mentor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning student to mentor',
            error: error.message
        });
    }
};

/**
 * Bulk assign students to mentor
 * POST /api/admin/assign/bulk-students
 */
export const bulkAssignStudents = async (req, res) => {
    try {
        const { studentIds, mentorId } = req.body;
        const targetMentorId = mentorId;
        const adminUserId = req.user.id;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'studentIds must be a non-empty array'
            });
        }

        if (!targetMentorId) {
            return res.status(400).json({
                success: false,
                message: 'mentorId is required'
            });
        }

        // Validate mentor exists and check capacity
        const mentor = await prisma.mentor.findUnique({
            where: { id: targetMentorId },
            include: {
                assignedStudents: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        const maxCapacity = 30;
        const availableCapacity = maxCapacity - mentor.assignedStudents.length;
        if (studentIds.length > availableCapacity) {
            return res.status(400).json({
                success: false,
                message: `Mentor can only accommodate ${availableCapacity} more students`
            });
        }

        // Deactivate existing assignments for these students
        await prisma.mentorAssignment.updateMany({
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
                prisma.mentorAssignment.create({
                    data: {
                        studentId,
                        mentorId: targetMentorId,
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
            message: `${assignments.length} students assigned to mentor successfully`
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
 * Reassign student to different mentor
 * PUT /api/admin/reassign/student
 */
export const reassignStudent = async (req, res) => {
    try {
        const { studentId, newMentorId } = req.body;
        const targetMentorId = newMentorId;
        const adminUserId = req.user.id;

        if (!studentId || !targetMentorId) {
            return res.status(400).json({
                success: false,
                message: 'studentId and newMentorId are required'
            });
        }

        // Deactivate current assignment
        await prisma.mentorAssignment.updateMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            data: {
                status: 'REASSIGNED'
            }
        });

        // Create new assignment
        const newAssignment = await prisma.mentorAssignment.create({
            data: {
                studentId,
                mentorId: targetMentorId,
                assignedBy: adminUserId,
                status: 'ACTIVE'
            },
            include: {
                student: {
                    select: { name: true, studentId: true }
                },
                mentor: {
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
            totalStudents,
            assignedStudents,
            totalUsers
        ] = await Promise.all([
            prisma.mentor.count(),
            prisma.student.count(),
            prisma.mentorAssignment.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({ where: { isActive: true } })
        ]);

        const unassignedStudents = Math.max(0, totalStudents - assignedStudents);

        res.status(200).json({
            success: true,
            data: {
                totalMentors,
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

        // Delete associated profile based on role with automatic student reassignment
        if (user.role === 'MENTOR') {
            const mentor = await prisma.mentor.findUnique({ where: { email: user.email } });
            if (mentor) {
                // Reassign mentor's students to other active mentors
                const activeAssignments = await prisma.mentorAssignment.findMany({
                    where: { mentorId: mentor.id, status: 'ACTIVE' }
                });
                const studentIds = activeAssignments.map(a => a.studentId);
                
                if (studentIds.length > 0) {
                    const otherMentors = await prisma.mentor.findMany({
                        where: { id: { not: mentor.id } }
                    });
                    if (otherMentors.length > 0) {
                        for (let i = 0; i < studentIds.length; i++) {
                            const targetMentor = otherMentors[i % otherMentors.length];
                            await prisma.mentorAssignment.create({
                                data: {
                                    studentId: studentIds[i],
                                    mentorId: targetMentor.id,
                                    assignedBy: req.user.id,
                                    status: 'ACTIVE'
                                }
                            });
                        }
                    }
                    await prisma.mentorAssignment.updateMany({
                        where: { mentorId: mentor.id },
                        data: { status: 'DELETED' }
                    });
                }
                await prisma.mentor.delete({ where: { id: mentor.id } });
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

/**
 * Reset a user's password to a temporary one
 * POST /api/admin/users/:id/reset-password
 */
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user to verify they exist and are not an admin
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
                message: 'Cannot reset password for other admin users'
            });
        }

        // Generate random secure password (8 characters)
        const tempPassword = crypto.randomBytes(6).toString('hex').slice(0, 8);

        // Hash password
        const hashedPassword = await bcrypt.hash(tempPassword, authConfig.bcrypt.saltRounds);

        // Update user
        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                isTemporaryPassword: true // Set back to temporary password
            }
        });

        // Send email with new credentials (or fallback to log)
        await sendPasswordResetEmail(user.email, user.name, tempPassword);

        logger.info(`Password reset by admin for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: `Password reset successfully. A temporary password has been generated.`,
            tempPassword
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};
