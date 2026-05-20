import prisma from '../config/database.js';

/**
 * Calculate risk reduction percentage for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Risk reduction metrics
 */
export const calculateRiskReduction = async (studentId) => {
  try {
    const logs = await prisma.counselingLog.findMany({
      where: { studentId },
      orderBy: { sessionDate: 'asc' }
    });

    if (logs.length === 0) {
      return { hasData: false, message: 'No counseling logs found' };
    }

    const firstLog = logs[0];
    const latestLog = logs[logs.length - 1];

    // If latest log has after snapshot, use it; otherwise use current student risk
    let currentRiskScore = latestLog.riskScoreAfter || latestLog.riskScoreBefore;
    let currentRiskLevel = latestLog.riskAfter || latestLog.riskBefore;

    if (!latestLog.riskScoreAfter) {
      // Get current student risk
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { dropoutRisk: true }
      });
      currentRiskLevel = student.dropoutRisk;
    }

    const initialRiskScore = firstLog.riskScoreBefore;
    const scoreReduction = initialRiskScore - currentRiskScore;
    const percentageReduction = ((scoreReduction / initialRiskScore) * 100).toFixed(2);

    return {
      hasData: true,
      initial: {
        riskLevel: firstLog.riskBefore,
        riskScore: initialRiskScore
      },
      current: {
        riskLevel: currentRiskLevel,
        riskScore: currentRiskScore
      },
      reduction: {
        scoreChange: scoreReduction,
        percentageReduction: parseFloat(percentageReduction)
      }
    };
  } catch (error) {
    console.error('Error calculating risk reduction:', error);
    throw error;
  }
};

/**
 * Calculate attendance improvement for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Attendance improvement metrics
 */
export const calculateAttendanceImprovement = async (studentId) => {
  try {
    const logs = await prisma.counselingLog.findMany({
      where: { studentId },
      orderBy: { sessionDate: 'asc' }
    });

    if (logs.length === 0) {
      return { hasData: false, message: 'No counseling logs found' };
    }

    // Get attendance records
    const firstLogDate = logs[0].sessionDate;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendanceRecords: {
          orderBy: { date: 'asc' }
        }
      }
    });

    // Calculate attendance before first counseling
    const recordsBefore = student.attendanceRecords.filter(r => new Date(r.date) < firstLogDate);
    const recordsAfter = student.attendanceRecords.filter(r => new Date(r.date) >= firstLogDate);

    const attendanceBefore = recordsBefore.length > 0
      ? (recordsBefore.filter(r => r.status === 'PRESENT').length / recordsBefore.length) * 100
      : 0;

    const attendanceAfter = recordsAfter.length > 0
      ? (recordsAfter.filter(r => r.status === 'PRESENT').length / recordsAfter.length) * 100
      : student.attendancePercent || 0;

    const improvement = attendanceAfter - attendanceBefore;

    return {
      hasData: true,
      initial: parseFloat(attendanceBefore.toFixed(2)),
      current: parseFloat(attendanceAfter.toFixed(2)),
      improvement: parseFloat(improvement.toFixed(2)),
      recordsBefore: recordsBefore.length,
      recordsAfter: recordsAfter.length
    };
  } catch (error) {
    console.error('Error calculating attendance improvement:', error);
    throw error;
  }
};

/**
 * Calculate marks/CGPA improvement for a student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Marks improvement metrics
 */
export const calculateMarksImprovement = async (studentId) => {
  try {
    const logs = await prisma.counselingLog.findMany({
      where: { studentId },
      orderBy: { sessionDate: 'asc' }
    });

    if (logs.length === 0) {
      return { hasData: false, message: 'No counseling logs found' };
    }

    const firstLogDate = logs[0].sessionDate;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        assessments: {
          orderBy: { date: 'asc' }
        }
      }
    });

    // Calculate average marks before and after
    const assessmentsBefore = student.assessments.filter(a => new Date(a.date) < firstLogDate);
    const assessmentsAfter = student.assessments.filter(a => new Date(a.date) >= firstLogDate);

    const avgBefore = assessmentsBefore.length > 0
      ? assessmentsBefore.reduce((sum, a) => sum + (a.marksObtained / a.totalMarks) * 100, 0) / assessmentsBefore.length
      : 0;

    const avgAfter = assessmentsAfter.length > 0
      ? assessmentsAfter.reduce((sum, a) => sum + (a.marksObtained / a.totalMarks) * 100, 0) / assessmentsAfter.length
      : 0;

    const marksImprovement = avgAfter - avgBefore;

    return {
      hasData: true,
      initial: {
        averageMarks: parseFloat(avgBefore.toFixed(2)),
        cgpa: student.currentCGPA || 0
      },
      current: {
        averageMarks: parseFloat(avgAfter.toFixed(2)),
        cgpa: student.currentCGPA || 0
      },
      improvement: {
        marksChange: parseFloat(marksImprovement.toFixed(2)),
        cgpaChange: 0 // Would need historical CGPA data
      },
      assessmentsBefore: assessmentsBefore.length,
      assessmentsAfter: assessmentsAfter.length
    };
  } catch (error) {
    console.error('Error calculating marks improvement:', error);
    throw error;
  }
};

/**
 * Generate comprehensive student impact report
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Student impact report
 */
export const generateStudentImpactReport = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        counselingLogs: {
          orderBy: { sessionDate: 'desc' }
        },
        interventionTasks: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all metrics
    const riskReduction = await calculateRiskReduction(studentId);
    const attendanceImprovement = await calculateAttendanceImprovement(studentId);
    const marksImprovement = await calculateMarksImprovement(studentId);

    // Calculate intervention summary
    const totalSessions = student.counselingLogs.length;
    const tasksCompleted = student.interventionTasks.filter(t => t.status === 'COMPLETED').length;
    const totalTasks = student.interventionTasks.length;

    // Calculate effectiveness score (0-10)
    let effectivenessScore = 0;
    if (riskReduction.hasData) {
      effectivenessScore += (riskReduction.reduction.percentageReduction / 10); // Max 10 points
    }
    if (attendanceImprovement.hasData) {
      effectivenessScore += (attendanceImprovement.improvement / 10); // Max 10 points
    }
    effectivenessScore = Math.min(10, effectivenessScore / 2); // Average and cap at 10

    return {
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      currentRisk: student.dropoutRisk,
      riskReduction,
      attendanceImprovement,
      marksImprovement,
      interventionSummary: {
        totalSessions,
        tasksAssigned: totalTasks,
        tasksCompleted,
        completionRate: totalTasks > 0 ? ((tasksCompleted / totalTasks) * 100).toFixed(2) : 0,
        effectivenessScore: parseFloat(effectivenessScore.toFixed(2))
      }
    };
  } catch (error) {
    console.error('Error generating student impact report:', error);
    throw error;
  }
};

/**
 * Generate mentor impact report
 * @param {string} mentorId - Mentor ID
 * @returns {Promise<Object>} Mentor impact report
 */
export const generateMentorImpactReport = async (mentorId) => {
  try {
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        assignedStudents: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                counselingLogs: {
                  where: { mentorId }
                }
              }
            }
          }
        }
      }
    });

    if (!mentor) {
      throw new Error('Mentor not found');
    }

    // Get all counseling logs by this mentor
    const allLogs = await prisma.counselingLog.findMany({
      where: { mentorId }
    });

    // Calculate metrics for each student
    const studentMetrics = [];
    let totalRiskReduction = 0;
    let studentsWithData = 0;
    let successfulStudents = 0; // Students moved to LOW risk

    for (const assignment of mentor.assignedStudents) {
      const studentId = assignment.student.id;
      const riskReduction = await calculateRiskReduction(studentId);
      
      if (riskReduction.hasData) {
        studentsWithData++;
        totalRiskReduction += riskReduction.reduction.percentageReduction;
        
        if (riskReduction.current.riskLevel === 'LOW') {
          successfulStudents++;
        }

        studentMetrics.push({
          studentId: assignment.student.studentId,
          name: assignment.student.name,
          riskReduction: riskReduction.reduction.percentageReduction,
          sessions: assignment.student.counselingLogs.length,
          currentRisk: assignment.student.dropoutRisk
        });
      }
    }

    const averageRiskReduction = studentsWithData > 0 ? (totalRiskReduction / studentsWithData) : 0;
    const successRate = mentor.assignedStudents.length > 0 
      ? ((successfulStudents / mentor.assignedStudents.length) * 100) 
      : 0;

    return {
      mentorId: mentor.id,
      name: mentor.name,
      email: mentor.email,
      department: mentor.department,
      studentsAssigned: mentor.assignedStudents.length,
      totalSessions: allLogs.length,
      averageRiskReduction: parseFloat(averageRiskReduction.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(2)),
      successfulStudents,
      studentBreakdown: studentMetrics.sort((a, b) => b.riskReduction - a.riskReduction)
    };
  } catch (error) {
    console.error('Error generating mentor impact report:', error);
    throw error;
  }
};
