import express from 'express';
import { getRiskProfile, getAllRiskProfiles } from '../controllers/riskController.js';
import { validateStudentId } from '../middleware/validation.js';

const router = express.Router();

// Get comprehensive risk profile for a single student
router.get('/profile/:id', validateStudentId, getRiskProfile);

// Get risk profiles for all students (with optional filtering)
router.get('/profiles', getAllRiskProfiles);

export default router;
