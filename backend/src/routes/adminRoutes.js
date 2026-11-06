import express from 'express';
import {
    getAllMentors,
    assignStudentToMentor,
    bulkAssignStudents,
    reassignStudent,
    getUserManagementStats,
    deleteUser,
    resetUserPassword
} from '../controllers/adminController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require ADMIN role
router.get('/mentors', authenticate, authorizeRole('ADMIN'), getAllMentors);
router.post('/assign/student-mentor', authenticate, authorizeRole('ADMIN'), assignStudentToMentor);
router.post('/assign/bulk-students', authenticate, authorizeRole('ADMIN'), bulkAssignStudents);
router.put('/reassign/student', authenticate, authorizeRole('ADMIN'), reassignStudent);
router.get('/stats', authenticate, authorizeRole('ADMIN'), getUserManagementStats);
router.delete('/users/:id', authenticate, authorizeRole('ADMIN'), deleteUser);
router.post('/users/:id/reset-password', authenticate, authorizeRole('ADMIN'), resetUserPassword);

export default router;
