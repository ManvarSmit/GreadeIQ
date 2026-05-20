import prisma from '../config/database.js';
import { calculateComprehensiveRisk } from './riskEngine.js';
/**
 * Create counseling log with before snapshot
 * @param {string} studentId - Student ID
 * @param {string} mentorId - Mentor ID
 * @param {string} notes - Session notes
 * @param {string} actionsTaken - Actions taken
 * @param {boolean} followUpRequired - Follow-up needed
 * @param {Date} followUpDate - Follow-up date
 * @returns {Promise<Object>} Created counseling log
 */
export const createCounselingLog = async (studentId, mentorId, notes, actionsTaken = null, followUpRequired = false, followUpDate = null) => {
  try {
    // Get student with current risk data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendanceRecords: { orderBy: { date: 'desc' } },
        assessments: { orderBy: { date: 'desc' } }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const riskProfile = calculateComprehensiveRisk(student);

    // Create counseling log
    const log = await prisma.counselingLog.create({
      data: {
        studentId,
        mentorId,
        sessionDate: new Date(),
        notes,
        actionsTaken,
        followUpRequired,
        followUpDate,
        riskBefore: riskProfile.overallRisk,
        riskScoreBefore: riskProfile.riskScore
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            department: true
          }
        }
      }
    });

    console.log(`Counseling log created for student ${student.studentId}`);
    return log;
  } catch (error) {
    console.error('Error creating counseling log:', error);
    throw error;
  }
};

/**
 * Update counseling log with after snapshot and calculate improvement
 * @param {string} logId - Counseling log ID
 * @returns {Promise<Object>} Updated log with improvement metrics
 */
export const updateCounselingLogAfter = async (logId) => {
  try {
    const log = await prisma.counselingLog.findUnique({
      where: { id: logId },
      include: {
        student: {
          include: {
            attendanceRecords: { orderBy: { date: 'desc' } },
            assessments: { orderBy: { date: 'desc' } }
          }
        }
      }
    });

    if (!log) {
      throw new Error('Counseling log not found');
    }

    const student = log.student;

    const riskProfile = calculateComprehensiveRisk(student);

    // Calculate improvement metrics
    const attendanceImprovement = student.attendancePercent - (log.riskScoreBefore * 0.6); // Approximate
    const cgpaImprovement = student.currentCGPA; // Would need historical data for accurate comparison

    // Update log
    const updatedLog = await prisma.counselingLog.update({
      where: { id: logId },
      data: {
        riskAfter: riskProfile.overallRisk,
        riskScoreAfter: riskProfile.riskScore,
        attendanceImprovement,
        cgpaImprovement
      }
    });

    console.log(`Counseling log updated with after snapshot for log ${logId}`);
    return updatedLog;
  } catch (error) {
    console.error('Error updating counseling log:', error);
    throw error;
  }
};

/**
 * Calculate improvement metrics for a student
 * @param {string} studentId - Student ID
 * @param {string} logId - Specific log ID (optional)
 * @returns {Promise<Object>} Improvement metrics
 */
export const calculateImprovement = async (studentId, logId = null) => {
  try {
    let logs;
    
    if (logId) {
      // Get specific log
      logs = [await prisma.counselingLog.findUnique({ where: { id: logId } })];
    } else {
      // Get all logs for student
      logs = await prisma.counselingLog.findMany({
        where: { studentId },
        orderBy: { sessionDate: 'desc' }
      });
    }

    if (!logs || logs.length === 0) {
      return { hasData: false, message: 'No counseling logs found' };
    }

    // Calculate aggregate improvements
    const logsWithAfter = logs.filter(l => l.riskAfter !== null);
    
    if (logsWithAfter.length === 0) {
      return { hasData: false, message: 'No completed counseling sessions with after snapshots' };
    }

    const improvements = logsWithAfter.map(log => ({
      logId: log.id,
      sessionDate: log.sessionDate,
      riskImprovement: log.riskScoreBefore - (log.riskScoreAfter || 0),
      riskBeforeAfter: `${log.riskBefore} → ${log.riskAfter}`,
      attendanceImprovement: log.attendanceImprovement,
      cgpaImprovement: log.cgpaImprovement
    }));

    const avgRiskImprovement = improvements.reduce((sum, i) => sum + i.riskImprovement, 0) / improvements.length;

    return {
      hasData: true,
      totalSessions: logs.length,
      completedSessions: logsWithAfter.length,
      averageRiskImprovement: avgRiskImprovement,
      improvements
    };
  } catch (error) {
    console.error('Error calculating improvement:', error);
    throw error;
  }
};

/**
 * Get counseling history for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Counseling logs
 */
export const getStudentCounselingHistory = async (studentId) => {
  try {
    const logs = await prisma.counselingLog.findMany({
      where: { studentId },
      orderBy: { sessionDate: 'desc' }
    });

    return logs;
  } catch (error) {
    console.error('Error fetching counseling history:', error);
    throw error;
  }
};

/**
 * Get overall improvement metrics for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Overall metrics
 */
export const getImprovementMetrics = async (studentId) => {
  try {
    const metrics = await calculateImprovement(studentId);
    
    // Get current student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        dropoutRisk: true,
        attendancePercent: true,
        currentCGPA: true
      }
    });

    return {
      ...metrics,
      currentStatus: {
        riskLevel: student.dropoutRisk,
        attendance: student.attendancePercent,
        cgpa: student.currentCGPA
      }
    };
  } catch (error) {
    console.error('Error fetching improvement metrics:', error);
    throw error;
  }
};
