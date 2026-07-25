import express from 'express';
import {
    getMyAssignedStudents,
    updateStudentDetails,
    getCounselorStats
} from '../controllers/counselorController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require COUNSELOR role
router.get('/my-students', authenticate, authorizeRole('COUNSELOR'), getMyAssignedStudents);
router.put('/student/:id/details', authenticate, authorizeRole('COUNSELOR'), updateStudentDetails);
router.get('/stats', authenticate, authorizeRole('COUNSELOR'), getCounselorStats);

export default router;
