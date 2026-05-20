import express from 'express';
import {
  assignMentorToStudent,
  createTask,
  getTasks,
  updateTask,
  getAlerts,
  markRead,
  checkSLA
} from '../controllers/interventionController.js';

const router = express.Router();

// Mentor assignment
router.post('/assign-mentor', assignMentorToStudent);

// Task management
router.post('/create-task', createTask);
router.get('/tasks', getTasks);
router.put('/tasks/:id', updateTask);

// Alerts
router.get('/alerts', getAlerts);
router.put('/alerts/:id/read', markRead);

// SLA check (can be triggered manually or via cron)
router.post('/check-sla', checkSLA);

export default router;
