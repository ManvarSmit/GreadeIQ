import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { errorResponse, successResponse } from '../utils/helpers.js';

// Counselors create quizzes
export const createQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'COUNSELOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Only counselors or admins can create quizzes', 403));
    }

    const { title, description, topics, durationMinutes, difficulty, negativeMarking, questions } = req.body;

    // Find counselor ID
    let counselor = await prisma.counselor.findUnique({
      where: { email: req.user.email }
    });

    if (!counselor && req.user.role === 'ADMIN') {
      // Auto-create an admin counselor footprint so foreign keys don't break postgres
      counselor = await prisma.counselor.create({
         data: {
             name: 'System Admin',
             email: req.user.email,
             department: 'Administration',
         }
      });
    } else if (!counselor) {
      return res.status(404).json(errorResponse('Counselor profile not found', 404));
    }

    const counselorId = counselor.id;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json(errorResponse('Questions array is required', 400));
    }

    const quiz = await prisma.quiz.create({
      data: {
        counselorId,
        title,
        description,
        topics,
        durationMinutes: parseInt(durationMinutes) || 30,
        difficulty: difficulty || 'MEDIUM',
        negativeMarking: parseFloat(negativeMarking) || 0.0,
        questions: {
          create: questions.map(q => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            marks: parseFloat(q.marks) || 1.0
          }))
        }
      },
      include: {
        questions: true
      }
    });

    logger.info(`Quiz created: ${quiz.id} by ${req.user.email}`);
    res.status(201).json(successResponse(quiz, 'Quiz created successfully'));
  } catch (error) {
    logger.error(`Create quiz error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to create quiz', 500));
  }
};

// Get all quizzes created by counselor
export const getMyQuizzes = async (req, res) => {
  try {
    const counselor = await prisma.counselor.findUnique({
      where: { email: req.user.email }
    });

    if (!counselor) return res.status(404).json(errorResponse('Counselor profile not found', 404));

    const quizzes = await prisma.quiz.findMany({
      where: { counselorId: counselor.id },
      include: {
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(successResponse(quizzes, 'Quizzes retrieved successfully'));
  } catch (error) {
    logger.error(`Get quizzes error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to fetch quizzes', 500));
  }
};

// Students get available quizzes
export const getStudentAvailableQuizzes = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json(errorResponse('Only students can fetch available quizzes', 403));
    }

    // Logic to fetch quizzes: could be global, or strictly assigned by counselor.
    // For now, fetch all quizzes not completed by student.
    const completedAttempts = await prisma.quizAttempt.findMany({
      where: { studentId: req.user.userId, status: 'COMPLETED' },
      select: { quizId: true }
    });

    const completedQuizIds = completedAttempts.map(a => a.quizId);

    const availableQuizzes = await prisma.quiz.findMany({
      where: {
        id: { notIn: completedQuizIds }
      },
      include: {
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(successResponse(availableQuizzes, 'Available quizzes fetched'));
  } catch (error) {
    logger.error(`Get student quizzes error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to fetch available quizzes', 500));
  }
};

// Students get past completed quiz attempts
export const getStudentPastAttempts = async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json(errorResponse('Only students can fetch their past attempts', 403));
    }

    const pastAttempts = await prisma.quizAttempt.findMany({
      where: { studentId: req.user.userId, status: 'COMPLETED' },
      include: {
        quiz: {
          select: {
            title: true,
            topics: true,
            difficulty: true,
            _count: { select: { questions: true } }
          }
        }
      },
      orderBy: { submitTime: 'desc' }
    });

    res.json(successResponse(pastAttempts, 'Past attempts fetched'));
  } catch (error) {
    logger.error(`Get past attempts error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to fetch past attempts', 500));
  }
};

// Get specific quiz details (without answers for students)
export const getQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true
      }
    });

    if (!quiz) return res.status(404).json(errorResponse('Quiz not found', 404));

    // If student, remove correct answers from payload to prevent inspection cheating
    if (req.user.role === 'STUDENT') {
      quiz.questions = quiz.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        // Also parse options back to array
        rest.options = JSON.parse(rest.options);
        return rest;
      });
    } else {
      quiz.questions = quiz.questions.map(q => {
        q.options = JSON.parse(q.options);
        return q;
      });
    }

    res.json(successResponse(quiz, 'Quiz fetched'));
  } catch (error) {
    logger.error(`Get quiz details error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to fetch quiz details', 500));
  }
};

// Student starts a quiz
export const startQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.body;
    if (req.user.role !== 'STUDENT') return res.status(403).json(errorResponse('Only students can attempt quizzes', 403));

    // Check if attempt already exists and is in progress
    const existing = await prisma.quizAttempt.findFirst({
      where: { quizId, studentId: req.user.userId, status: 'IN_PROGRESS' }
    });

    if (existing) {
      return res.json(successResponse(existing, 'Resuming existing attempt'));
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: req.user.userId,
        status: 'IN_PROGRESS'
      }
    });

    res.status(201).json(successResponse(attempt, 'Quiz started'));
  } catch (error) {
    logger.error(`Start quiz error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to start quiz', 500));
  }
};

// Student submits a quiz
export const submitQuizAttempt = async (req, res) => {
  try {
    const { attemptId, answers, isAutoSubmitted } = req.body;
    if (req.user.role !== 'STUDENT') return res.status(403).json(errorResponse('Forbidden', 403));

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { include: { questions: true } } }
    });

    if (!attempt || attempt.studentId !== req.user.userId) {
      return res.status(404).json(errorResponse('Attempt not found', 404));
    }

    if (attempt.status === 'COMPLETED') {
      return res.status(400).json(errorResponse('Attempt already completed', 400));
    }

    // Calculate score
    let score = 0;
    const questions = attempt.quiz.questions;
    
    // answers should be object { questionId: 'selectedOptionText' }
    for (const q of questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && studentAnswer === q.correctAnswer) {
        score += q.marks;
      } else if (studentAnswer) {
        // Negative marking
        score -= attempt.quiz.negativeMarking;
      }
    }

    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        submitTime: new Date(),
        status: 'COMPLETED',
        isAutoSubmitted: isAutoSubmitted || false
      }
    });

    res.json(successResponse({ score, attempt: updatedAttempt }, 'Quiz submitted successfully'));
  } catch (error) {
    logger.error(`Submit quiz error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to submit quiz', 500));
  }
};

// Anti-Cheating: Log violation
export const logViolation = async (req, res) => {
  try {
    const { attemptId, violationType } = req.body;
    if (req.user.role !== 'STUDENT') return res.status(403).json(errorResponse('Forbidden', 403));

    const log = await prisma.violationLog.create({
      data: {
        attemptId,
        studentId: req.user.userId,
        violationType // TAB_SWITCH, BLUR_FOCUS
      }
    });

    logger.warn(`Cheating violation logged for student ${req.user.userId}: ${violationType}`);
    res.status(201).json(successResponse(log, 'Violation logged'));
  } catch (error) {
    logger.error(`Log violation error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to log violation', 500));
  }
};
