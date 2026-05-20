import express from 'express';
import multer from 'multer';
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  getStudentStats
} from '../controllers/studentController.js';
import { clearAllData } from '../controllers/clearDataController.js';
import {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentId,
  validateQueryParams
} from '../middleware/validation.js';

const router = express.Router();

// Configure multer for CSV upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Student CRUD routes
router.post('/', validateCreateStudent, createStudent);
router.get('/', validateQueryParams, getAllStudents);
router.get('/stats', getStudentStats);

// CSV Bulk upload route (must be before /:id routes)
router.post('/upload/csv', upload.single('file'), bulkUploadStudents);

// Clear all data route (DANGER - Admin only, must be before /:id routes)
router.delete('/clear-all', clearAllData);

// Parameterized routes (must be last to avoid catching other routes)
router.get('/:id', validateStudentId, getStudentById);
router.put('/:id', validateUpdateStudent, updateStudent);
router.delete('/:id', validateStudentId, deleteStudent);

export default router;
