import express from 'express';
import {
  getMyStudents,
  getMyStats,
  updateStudentDetails,
  updateStudentMarks,
  updateStudentAttendance
} from '../controllers/mentorController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-students', authorizeRole('MENTOR', 'ADMIN'), getMyStudents);
router.get('/stats', authorizeRole('MENTOR', 'ADMIN'), getMyStats);
router.put('/student/:id/details', authorizeRole('MENTOR', 'ADMIN'), updateStudentDetails);
router.post('/student/:id/marks', authorizeRole('MENTOR', 'ADMIN'), updateStudentMarks);
router.post('/student/:id/attendance', authorizeRole('MENTOR', 'ADMIN'), updateStudentAttendance);

export default router;
