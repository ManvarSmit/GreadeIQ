import express from 'express';
import { analyzeStudent, suggestMentorsForStudent, getStudentImprovementPlan, autoAssignMentor } from '../controllers/aiController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// AI Analysis Routes - Admin and Counselor only
router.post('/analyze-student/:studentId',
    authenticate,
    authorizeRole('ADMIN', 'COUNSELOR'),
    analyzeStudent
);

router.post('/suggest-mentors/:studentId',
    authenticate,
    authorizeRole('ADMIN', 'COUNSELOR'),
    suggestMentorsForStudent
);

router.post('/improvement-plan/:studentId',
    authenticate,
    authorizeRole('ADMIN', 'COUNSELOR', 'MENTOR'),
    getStudentImprovementPlan
);

router.post('/auto-assign/:studentId',
    authenticate,
    authorizeRole('ADMIN', 'COUNSELOR'),
    autoAssignMentor
);

export default router;
