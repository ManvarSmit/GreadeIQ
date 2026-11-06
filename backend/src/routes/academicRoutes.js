import express from 'express';
import multer from 'multer';
import {
  addAttendance,
  addAssessment,
  getStudentAcademicProfile,
  bulkUploadAttendance,
  bulkUploadAssessments,
  uploadAssessmentsCSV,
  uploadAttemptsCSV
} from '../controllers/academicController.js';
import { validateStudentId } from '../middleware/validation.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Single Record Entry - MENTOR & ADMIN
router.post('/attendance', authenticate, authorizeRole('MENTOR', 'ADMIN'), addAttendance);
router.post('/assessment', authenticate, authorizeRole('MENTOR', 'ADMIN'), addAssessment);

// Merged Data View - All authenticated users
router.get('/profile/:id', authenticate, validateStudentId, getStudentAcademicProfile);

// Bulk CSV Uploads - MENTOR & ADMIN
router.post('/attendance/upload', authenticate, authorizeRole('MENTOR', 'ADMIN'), upload.single('file'), bulkUploadAttendance);
router.post('/assessment/upload', authenticate, authorizeRole('MENTOR', 'ADMIN'), upload.single('file'), bulkUploadAssessments);

// CSV Upload Routes - MENTOR & ADMIN
router.post('/assessments/upload/csv', authenticate, authorizeRole('MENTOR', 'ADMIN'), upload.single('file'), uploadAssessmentsCSV);
router.post('/attempts/upload/csv', authenticate, authorizeRole('MENTOR', 'ADMIN'), upload.single('file'), uploadAttemptsCSV);

export default router;
