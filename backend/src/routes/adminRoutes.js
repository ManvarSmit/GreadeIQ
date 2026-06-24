import express from 'express';
import {
    getAllMentors,
    getAllCounselors,
    assignStudentToCounselor,
    assignMentorToCounselor,
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
router.get('/counselors', authenticate, authorizeRole('ADMIN'), getAllCounselors);
router.post('/assign/student-counselor', authenticate, authorizeRole('ADMIN'), assignStudentToCounselor);
router.post('/assign/mentor-counselor', authenticate, authorizeRole('ADMIN'), assignMentorToCounselor);
router.post('/assign/bulk-students', authenticate, authorizeRole('ADMIN'), bulkAssignStudents);
router.put('/reassign/student', authenticate, authorizeRole('ADMIN'), reassignStudent);
router.get('/stats', authenticate, authorizeRole('ADMIN'), getUserManagementStats);
router.delete('/users/:id', authenticate, authorizeRole('ADMIN'), deleteUser);
router.post('/users/:id/reset-password', authenticate, authorizeRole('ADMIN'), resetUserPassword);


export default router;
