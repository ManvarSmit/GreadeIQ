import prisma from '../config/database.js';
import { analyzeStudentProblems, suggestMentors, generateStudentImprovementPlan } from '../services/geminiService.js';
import { autoAssignMentor as autoAssignMentorService } from '../services/interventionService.js';

/**
 * Analyze student problems using Gemini AI
 * POST /api/ai/analyze-student/:studentId
 */
export const analyzeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student with counseling notes
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                studentId: true,
                counselingNotes: true
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!student.counselingNotes || student.counselingNotes.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No mentorship or counseling notes available for analysis'
            });
        }

        // Analyze using Gemini
        const analysis = await analyzeStudentProblems(student.counselingNotes);

        // Update student with AI analysis
        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: {
                problemCategories: JSON.stringify(analysis.categories),
                aiAnalysis: analysis.summary,
                aiAnalyzedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            data: {
                studentId: student.studentId,
                studentName: student.name,
                categories: analysis.categories,
                summary: analysis.summary,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                analyzedAt: updatedStudent.aiAnalyzedAt
            }
        });

    } catch (error) {
        console.error('AI Analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze student',
            error: error.message
        });
    }
};

/**
 * Get mentor suggestions based on student's problem categories
 * POST /api/ai/suggest-mentors/:studentId
 */
export const suggestMentorsForStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student with AI analysis
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                studentId: true,
                problemCategories: true,
                aiAnalysis: true,
                aiAnalyzedAt: true,
                department: true,
                dropoutRisk: true,
                counselingNotes: true
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!student.problemCategories) {
            return res.status(400).json({
                success: false,
                message: 'Student has not been analyzed yet. Please analyze first.'
            });
        }

        const problemCategories = JSON.parse(student.problemCategories);

        // Get all available mentors
        const mentors = await prisma.mentor.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                specialization: true,
                maxStudents: true,
                assignedStudents: {
                    where: { status: 'ACTIVE' },
                    select: { id: true }
                }
            }
        });

        // Calculate current load and filter out full mentors
        const availableMentors = mentors
            .map(mentor => ({
                ...mentor,
                currentLoad: mentor.assignedStudents.length,
                hasCapacity: mentor.assignedStudents.length < mentor.maxStudents
            }))
            .filter(mentor => mentor.hasCapacity);

        // Get mentor suggestions
        const suggestions = await suggestMentors({
            problemCategories,
            counselingNotes: student.counselingNotes || student.aiAnalysis || '',
            department: student.department || 'Unknown',
            dropoutRisk: student.dropoutRisk || 'Unknown'
        }, availableMentors);

        res.status(200).json({
            success: true,
            data: {
                studentId: student.studentId,
                studentName: student.name,
                problemCategories,
                aiSummary: student.aiAnalysis,
                suggestions: suggestions.map(mentor => ({
                    id: mentor.id,
                    name: mentor.name,
                    email: mentor.email,
                    department: mentor.department,
                    specialization: mentor.specialization,
                    currentLoad: mentor.currentLoad,
                    maxStudents: mentor.maxStudents,
                    matchScore: mentor.matchScore,
                    expectedReasoning: mentor.distinguishedReasoning,
                    isRecommended: mentor.isRecommended
                }))
            }
        });

    } catch (error) {
        console.error('Suggest mentors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suggest mentors',
            error: error.message
        });
    }
};

export const getStudentImprovementPlan = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const plan = await generateStudentImprovementPlan(student);

        res.json({
            success: true,
            data: plan
        });

    } catch (error) {
        console.error('Improvement Plan Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate improvement plan',
            error: error.message
        });
    }
};

export const autoAssignMentor = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Fetch Student Data
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                mentorAssignments: {
                    where: { status: 'ACTIVE' }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Eligibility Checks
        if (student.mentorAssignments && student.mentorAssignments.length > 0) {
            return res.status(400).json({ success: false, message: 'Student already has an active mentor' });
        }

        const riskLevel = (student.dropoutRisk || '').toUpperCase();
        if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL' && riskLevel !== 'MEDIUM') {
            return res.status(400).json({
                success: false,
                message: `Auto-assignment requires at least MEDIUM risk level. Current: ${student.dropoutRisk}`
            });
        }

        // 3. Delegate to interventionService
        const assignment = await autoAssignMentorService(studentId);

        if (!assignment || !assignment.mentor) {
            return res.status(404).json({
                success: false,
                message: 'No mentors with available capacity found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                assignment,
                mentorName: assignment.mentor.name,
                mentorSpecialization: assignment.mentor.specialization,
                assignmentReason: `Assigned based on ${student.counselingNotes ? 'AI analysis' : 'availability'}`
            },
            message: `Successfully assigned to ${assignment.mentor.name}`
        });
    } catch (error) {
        console.error('Auto-Assign Error:', error);
        res.status(500).json({ success: false, message: 'Auto-assignment failed', error: error.message });
    }
};

export default {
    analyzeStudent,
    suggestMentorsForStudent,
    getStudentImprovementPlan,
    autoAssignMentor
};
