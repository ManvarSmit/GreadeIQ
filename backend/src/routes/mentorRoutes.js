import express from 'express';
import { getMyStudents, getMyCounselors, getStudentsByCounselor, getMyCounselorStats, updateStudentMarks, updateStudentAttendance } from '../controllers/mentorController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-students', authorizeRole('MENTOR', 'ADMIN'), getMyStudents);
router.get('/my-counselors', authorizeRole('MENTOR', 'ADMIN'), getMyCounselors);
router.get('/counselor/:id/students', authorizeRole('MENTOR', 'ADMIN'), getStudentsByCounselor);
router.get('/counselor-stats', authorizeRole('MENTOR', 'ADMIN'), getMyCounselorStats);

router.post('/student/:id/marks', authorizeRole('MENTOR', 'ADMIN'), updateStudentMarks);
router.post('/student/:id/attendance', authorizeRole('MENTOR', 'ADMIN'), updateStudentAttendance);

export default router;
