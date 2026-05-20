import express from 'express';
import { 
  createQuiz, 
  getMyQuizzes, 
  getStudentAvailableQuizzes, 
  getStudentPastAttempts,
  getQuizDetails, 
  startQuizAttempt, 
  submitQuizAttempt, 
  logViolation 
} from '../controllers/quizController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Counselor/Admin routes
router.post('/create', createQuiz);
router.get('/my-quizzes', getMyQuizzes);

// Student routes
router.get('/available', getStudentAvailableQuizzes);
router.get('/past-attempts', getStudentPastAttempts);
router.post('/start', startQuizAttempt);
router.post('/submit', submitQuizAttempt);
router.post('/violation', logViolation);

// Shared route
router.get('/:id', getQuizDetails);

export default router;
