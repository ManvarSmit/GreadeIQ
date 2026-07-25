import express from 'express';
import {
  getStudentImpact,
  getRiskReduction,
  getAttendanceImprovement,
  getMarksImprovement,
  getMentorImpact
} from '../controllers/reportingController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Student-level reports
router.get('/student/:id/impact', getStudentImpact);
router.get('/student/:id/risk-reduction', getRiskReduction);
router.get('/student/:id/attendance-improvement', getAttendanceImprovement);
router.get('/student/:id/marks-improvement', getMarksImprovement);

// Mentor-level reports
router.get('/mentor/:id/impact', getMentorImpact);

export default router;
