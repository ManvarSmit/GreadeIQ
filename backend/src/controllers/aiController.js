import prisma from '../config/database.js';
import { analyzeStudentProblems, suggestMentors, generateStudentImprovementPlan } from '../services/geminiService.js';

/**
 * Analyze student problems using Gemini AI
 * POST /api/ai/analyze-student/:studentId
 */
export const analyzeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student with counselor notes
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                studentId: true,
                counselorNotes: true
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!student.counselorNotes || student.counselorNotes.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No counselor notes available for analysis'
            });
        }

        // Analyze using Gemini
        const analysis = await analyzeStudentProblems(student.counselorNotes);

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
                aiAnalyzedAt: true
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
            counselorNotes: student.aiAnalysis || '', // Using AI summary as notes proxy if raw notes unavailable here, or fetch notes if needed
            department: 'Unknown', // Ideally fetch this
            dropoutRisk: 'Unknown'
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
                counselorAssignments: {
                    include: {
                        counselor: true
                    }
                },
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

        if (!student.counselorAssignments || student.counselorAssignments.length === 0) {
            return res.status(400).json({ success: false, message: 'Student must be assigned to a counselor first' });
        }

        // Check dropout risk level (case-insensitive comparison)
        const riskLevel = (student.dropoutRisk || '').toUpperCase();
        if (riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL' && riskLevel !== 'MEDIUM') {
            // Allow HIGH, CRITICAL, and MEDIUM risk students for auto-assignment
            return res.status(400).json({
                success: false,
                message: `Auto-assignment requires at least MEDIUM risk level. Current: ${student.dropoutRisk}`
            });
        }

        // 3. Smart AI-Powered Matching
        let selectedMentor = null;

        // Check if student has counselor notes for intelligent matching
        if (student.counselorNotes && student.counselorNotes.trim().length > 0) {
            console.log('Student has counselor notes - using AI matching...');
            console.log('Notes preview:', student.counselorNotes.substring(0, 150));

            try {
                // Analyze notes with Gemini AI
                const analysis = await analyzeStudentProblems(student.counselorNotes);
                const problemCategories = analysis.categories || [];

                console.log('AI detected problems:', problemCategories);

                // Get available mentors
                const mentors = await prisma.mentor.findMany({
                    include: {
                        assignedStudents: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                });

                const availableMentors = mentors
                    .map(m => ({
                        ...m,
                        currentLoad: m.assignedStudents.length,
                        hasCapacity: m.assignedStudents.length < m.maxStudents
                    }))
                    .filter(m => m.hasCapacity);

                if (availableMentors.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No mentors with available capacity found'
                    });
                }

                // Use AI matching to find best mentor
                const suggestions = await suggestMentors({
                    problemCategories,
                    counselorNotes: student.counselorNotes,
                    department: student.department || 'Unknown',
                    dropoutRisk: student.dropoutRisk
                }, availableMentors);

                // Prioritize mentors with match score > 5 (good match)
                const goodMatches = suggestions.filter(m => m.matchScore > 5);

                if (goodMatches.length > 0) {
                    selectedMentor = goodMatches[0]; // Best match
                    console.log('✓ Found perfect match:', selectedMentor.name, 'Score:', selectedMentor.matchScore);
                } else {
                    // Fallback: nearest match (highest score among available)
                    selectedMentor = suggestions[0];
                    console.log('→ Using nearest match:', selectedMentor.name, 'Score:', selectedMentor.matchScore);
                }

            } catch (aiError) {
                console.error('AI matching failed, falling back to load-based:', aiError.message);
                // Fallback to simple assignment if AI fails
                selectedMentor = null;
            }
        }

        // 4. Fallback: Simple load-based assignment if no notes or AI failed
        if (!selectedMentor) {
            console.log('Using simple load-based assignment...');

            const mentors = await prisma.mentor.findMany({
                include: {
                    assignedStudents: {
                        where: { status: 'ACTIVE' }
                    }
                }
            });

            const availableMentors = mentors
                .map(m => ({
                    ...m,
                    currentLoad: m.assignedStudents.length,
                    hasCapacity: m.assignedStudents.length < m.maxStudents
                }))
                .filter(m => m.hasCapacity)
                .sort((a, b) => a.currentLoad - b.currentLoad);

            if (availableMentors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No mentors with available capacity found'
                });
            }

            selectedMentor = availableMentors[0];
        }

        console.log('Final mentor selection:', {
            name: selectedMentor.name,
            specialization: selectedMentor.specialization,
            currentLoad: selectedMentor.currentLoad,
            maxStudents: selectedMentor.maxStudents
        });

        // 5. Assign Mentor
        const assignment = await prisma.mentorAssignment.create({
            data: {
                studentId: student.id,
                mentorId: selectedMentor.id,
                status: 'ACTIVE',
                assignedAt: new Date()
            }
        });

        // 6. Return Success
        res.status(200).json({
            success: true,
            data: {
                assignment,
                mentorName: selectedMentor.name,
                mentorSpecialization: selectedMentor.specialization,
                assignmentReason: `Assigned based on ${student.counselorNotes ? 'AI analysis' : 'availability'}`
            },
            message: `Successfully assigned to ${selectedMentor.name}`
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
// force reload 02/07/2026 15:46:34
