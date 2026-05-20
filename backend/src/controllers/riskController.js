import prisma from '../config/database.js';
import { calculateComprehensiveRisk } from '../services/riskEngine.js';
/**
 * Get comprehensive risk profile for a student (with ML integration)
 * GET /api/risk/profile/:id
 */
export const getRiskProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendanceRecords: {
          orderBy: { date: 'desc' }
        },
        assessments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate comprehensive risk
    const riskProfile = calculateComprehensiveRisk(student);

    // Auto-trigger interventions for HIGH risk students
    if (riskProfile.overallRisk === 'HIGH') {
      try {
        const { triggerHighRiskAlert } = await import('../services/alertService.js');
        const { autoAssignMentor, createInterventionTask } = await import('../services/interventionService.js');
        
        // Create alert
        await triggerHighRiskAlert(student);
        
        // Auto-assign mentor if available
        const assignment = await autoAssignMentor(student.id);
        
        // Create intervention task
        await createInterventionTask(
          student.id,
          'HIGH',
          `Immediate Intervention Required for ${student.name}`,
          `Student showing HIGH dropout risk. ${riskProfile.recommendations.join('. ')}`,
          assignment?.mentorId
        );
        
        console.log(`Auto-intervention triggered for HIGH risk student: ${student.studentId}`);
      } catch (error) {
        console.error('Error triggering interventions:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: riskProfile
    });
  } catch (error) {
    console.error('Get risk profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk profile',
      error: error.message
    });
  }
};

/**
 * Get risk profiles for all students (with optional filtering)
 * GET /api/risk/profiles?riskLevel=HIGH
 */
export const getAllRiskProfiles = async (req, res) => {
  try {
    const { riskLevel, department } = req.query;

    const where = {};
    if (riskLevel) where.dropoutRisk = riskLevel;
    if (department) where.department = department;

    const students = await prisma.student.findMany({
      where,
      include: {
        attendanceRecords: {
          orderBy: { date: 'desc' }
        },
        assessments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    const riskProfiles = students.map(student => {
      return calculateComprehensiveRisk(student);
    });

    // Sort by risk score (highest first)
    riskProfiles.sort((a, b) => (b.riskScore) - (a.riskScore));

    res.status(200).json({
      success: true,
      count: riskProfiles.length,
      data: riskProfiles
    });
  } catch (error) {
    console.error('Get all risk profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk profiles',
      error: error.message
    });
  }
};
