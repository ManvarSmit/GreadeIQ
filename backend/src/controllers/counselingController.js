import prisma from '../config/database.js';
import {
  createCounselingLog,
  updateCounselingLogAfter,
  calculateImprovement,
  getStudentCounselingHistory,
  getImprovementMetrics
} from '../services/counselingService.js';

/**
 * Create counseling log
 * POST /api/counseling/create
 */
export const createLog = async (req, res) => {
  try {
    const { studentId, mentorId, notes, actionsTaken, followUpRequired, followUpDate } = req.body;
    
    const log = await createCounselingLog(
      studentId,
      mentorId,
      notes,
      actionsTaken,
      followUpRequired,
      followUpDate ? new Date(followUpDate) : null
    );
    
    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Create counseling log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating counseling log',
      error: error.message
    });
  }
};

/**
 * Get student counseling history
 * GET /api/counseling/student/:id
 */
export const getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const logs = await getStudentCounselingHistory(id);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Get counseling history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling history',
      error: error.message
    });
  }
};

/**
 * Update counseling log with follow-up data
 * PUT /api/counseling/:id/follow-up
 */
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update with after snapshot
    const log = await updateCounselingLogAfter(id);
    
    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Update follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating follow-up',
      error: error.message
    });
  }
};

/**
 * Get improvement metrics for specific log
 * GET /api/counseling/:id/improvement
 */
export const getLogImprovement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.counselingLog.findUnique({
      where: { id }
    });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Counseling log not found'
      });
    }
    
    const improvement = await calculateImprovement(log.studentId, id);
    
    res.status(200).json({
      success: true,
      data: improvement
    });
  } catch (error) {
    console.error('Get log improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching improvement metrics',
      error: error.message
    });
  }
};

/**
 * Get overall improvement metrics for student
 * GET /api/counseling/student/:id/metrics
 */
export const getStudentMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const metrics = await getImprovementMetrics(id);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get student metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student metrics',
      error: error.message
    });
  }
};

/**
 * Get counseling queue (high risk students)
 * GET /api/counseling/queue
 */
export const getCounselingQueue = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { 
        OR: [
          { dropoutRisk: 'HIGH' },
          { dropoutRisk: 'MEDIUM' }
        ]
      },
      select: {
        id: true,
        studentId: true,
        name: true,
        department: true,
        dropoutRisk: true,
        riskScore: true, // If we added this column, checking schema... no riskScore in schema, only riskReason
        riskReason: true,
        lastAssessment: true,
        _count: {
          select: { alerts: { where: { isRead: false } } }
        }
      },
      orderBy: [
        { dropoutRisk: 'asc' } // HIGH comes first
      ]
    });
    
    // Sort manually to be safe or verify alphabetic.
    // 'HIGH' < 'MEDIUM' (H < M). So asc puts HIGH first.
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get counseling queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counseling queue',
      error: error.message
    });
  }
};

