import express from 'express';
import multer from 'multer';
import { uploadAttendanceCSV } from '../controllers/academicController.js';

const router = express.Router();

// Configure multer for CSV upload
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

// Attendance CSV upload
router.post('/upload/csv', upload.single('file'), uploadAttendanceCSV);

export default router;
