import {
  calculateRiskReduction,
  calculateAttendanceImprovement,
  calculateMarksImprovement,
  generateStudentImpactReport,
  generateMentorImpactReport
} from '../services/reportingService.js';

/**
 * Get student impact report
 * GET /api/reports/student/:id/impact
 */
export const getStudentImpact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await generateStudentImpactReport(id);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get student impact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating student impact report',
      error: error.message
    });
  }
};

/**
 * Get risk reduction metrics
 * GET /api/reports/student/:id/risk-reduction
 */
export const getRiskReduction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const metrics = await calculateRiskReduction(id);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get risk reduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating risk reduction',
      error: error.message
    });
  }
};

/**
 * Get attendance improvement metrics
 * GET /api/reports/student/:id/attendance-improvement
 */
export const getAttendanceImprovement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const metrics = await calculateAttendanceImprovement(id);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get attendance improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating attendance improvement',
      error: error.message
    });
  }
};

/**
 * Get marks improvement metrics
 * GET /api/reports/student/:id/marks-improvement
 */
export const getMarksImprovement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const metrics = await calculateMarksImprovement(id);
    
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get marks improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating marks improvement',
      error: error.message
    });
  }
};

/**
 * Get mentor impact report
 * GET /api/reports/mentor/:id/impact
 */
export const getMentorImpact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await generateMentorImpactReport(id);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get mentor impact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating mentor impact report',
      error: error.message
    });
  }
};
