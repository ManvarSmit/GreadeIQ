import express from 'express';
import {
  getDepartmentRisk,
  getSubjectFailures,
  getSemesterTransition,
  getAdminDashboard,
  exportCSV,
  exportPDF
} from '../controllers/analyticsController.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Analytics endpoints
router.get('/department-risk', getDepartmentRisk);
router.get('/subject-failures', getSubjectFailures);
router.get('/semester-transition', getSemesterTransition);
router.get('/admin-insights', getAdminDashboard);

// Export endpoints
router.post('/export-csv', exportCSV);
router.post('/export-pdf', exportPDF);

export default router;
