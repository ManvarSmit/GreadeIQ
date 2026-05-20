import express from 'express';
import {
  createLog,
  getHistory,
  updateFollowUp,
  getLogImprovement,
  getStudentMetrics,
  getCounselingQueue
} from '../controllers/counselingController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get counseling queue (high risk students)
// Higher priority than :id routes to avoid collision
router.get('/queue', authorizeRole('COUNSELOR', 'ADMIN'), getCounselingQueue);

// Create counseling log
router.post('/create', authorizeRole('COUNSELOR', 'ADMIN'), createLog);

// Get student counseling history
router.get('/student/:id', getHistory);

// Update with follow-up data (triggers after snapshot)
router.put('/:id/follow-up', updateFollowUp);

// Get improvement metrics for specific log
router.get('/:id/improvement', getLogImprovement);

// Get overall improvement metrics for student
router.get('/student/:id/metrics', getStudentMetrics);

export default router;
