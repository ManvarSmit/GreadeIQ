import express from 'express';
import multer from 'multer';
import { uploadFeesCSV, getAllFees, getFeeByStudentId } from '../controllers/feeController.js';

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

// Fee routes
router.get('/', getAllFees);
router.get('/student/:studentId', getFeeByStudentId);
router.post('/upload/csv', upload.single('file'), uploadFeesCSV);

export default router;
