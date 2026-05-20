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

// Single Record Entry - COUNSELOR ONLY
router.post('/attendance', authenticate, authorizeRole('COUNSELOR'), addAttendance);
router.post('/assessment', authenticate, authorizeRole('COUNSELOR'), addAssessment);

// Merged Data View - All authenticated users
router.get('/profile/:id', authenticate, validateStudentId, getStudentAcademicProfile);

// Bulk CSV Uploads - COUNSELOR ONLY
router.post('/attendance/upload', authenticate, authorizeRole('COUNSELOR'), upload.single('file'), bulkUploadAttendance);
router.post('/assessment/upload', authenticate, authorizeRole('COUNSELOR'), upload.single('file'), bulkUploadAssessments);

// New CSV Upload Routes - COUNSELOR ONLY
router.post('/assessments/upload/csv', authenticate, authorizeRole('COUNSELOR'), upload.single('file'), uploadAssessmentsCSV);
router.post('/attempts/upload/csv', authenticate, authorizeRole('COUNSELOR'), upload.single('file'), uploadAttemptsCSV);

export default router;
