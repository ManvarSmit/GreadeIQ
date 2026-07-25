import express from 'express';
import { getRiskProfile, getAllRiskProfiles } from '../controllers/riskController.js';
import { validateStudentId } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get comprehensive risk profile for a single student
router.get('/profile/:id', validateStudentId, getRiskProfile);

// Get risk profiles for all students (with optional filtering)
router.get('/profiles', getAllRiskProfiles);

export default router;
