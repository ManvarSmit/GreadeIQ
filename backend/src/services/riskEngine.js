import prisma from '../config/database.js';

/**
 * Analyzes attendance trend over time
 * @param {Array} attendanceRecords - Sorted attendance records (newest first)
 * @returns {Object} { trend, percentageChange, recentPercent, previousPercent }
 */
export const analyzeAttendanceTrend = (attendanceRecords) => {
  if (attendanceRecords.length < 10) {
    return { trend: 'INSUFFICIENT_DATA', percentageChange: 0, recentPercent: 0, previousPercent: 0 };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Recent 30 days
  const recentRecords = attendanceRecords.filter(r => new Date(r.date) >= thirtyDaysAgo);
  const recentPresent = recentRecords.filter(r => r.status === 'PRESENT').length;
  const recentPercent = recentRecords.length > 0 ? (recentPresent / recentRecords.length) * 100 : 0;

  // Previous 30 days (30-60 days ago)
  const previousRecords = attendanceRecords.filter(r => {
    const date = new Date(r.date);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });
  const previousPresent = previousRecords.filter(r => r.status === 'PRESENT').length;
  const previousPercent = previousRecords.length > 0 ? (previousPresent / previousRecords.length) * 100 : 0;

  const percentageChange = recentPercent - previousPercent;

  let trend = 'STABLE';
  if (percentageChange < -15) trend = 'DECLINING';
  else if (percentageChange > 15) trend = 'IMPROVING';

  return { trend, percentageChange, recentPercent, previousPercent };
};

/**
 * Detects sudden performance drop in assessments
 * @param {Array} assessments - Sorted assessments (newest first)
 * @returns {Object} { hasDropped, dropPercentage, recentAvg, previousAvg }
 */
export const detectPerformanceDrop = (assessments) => {
  if (assessments.length < 6) {
    return { hasDropped: false, dropPercentage: 0, recentAvg: 0, previousAvg: 0 };
  }

  // Recent 3 assessments
  const recent = assessments.slice(0, 3);
  const recentAvg = recent.reduce((sum, a) => sum + (a.marksObtained / a.totalMarks) * 100, 0) / recent.length;

  // Previous 3 assessments
  const previous = assessments.slice(3, 6);
  const previousAvg = previous.reduce((sum, a) => sum + (a.marksObtained / a.totalMarks) * 100, 0) / previous.length;

  const dropPercentage = previousAvg - recentAvg;
  const hasDropped = dropPercentage > 20;

  return { hasDropped, dropPercentage, recentAvg, previousAvg };
};

/**
 * Detects inactivity patterns
 * @param {Array} attendanceRecords - Attendance records
 * @param {Array} assessments - Assessment records
 * @returns {Object} { missedExams, attendanceGap, lastAttendance, lastAssessment }
 */
export const detectInactivity = (attendanceRecords, assessments) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check for missed exams (no assessment in last 30 days)
  const recentAssessments = assessments.filter(a => new Date(a.date) >= thirtyDaysAgo);
  const missedExams = recentAssessments.length === 0 && assessments.length > 0;

  // Check for attendance gaps (consecutive absences)
  let maxGap = 0;
  let currentGap = 0;
  
  const sortedAttendance = [...attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  for (const record of sortedAttendance) {
    if (record.status === 'ABSENT') {
      currentGap++;
      maxGap = Math.max(maxGap, currentGap);
    } else {
      currentGap = 0;
    }
  }

  const lastAttendance = sortedAttendance.length > 0 ? sortedAttendance[0].date : null;
  const lastAssessment = assessments.length > 0 ? assessments[0].date : null;

  return { 
    missedExams, 
    attendanceGap: maxGap,
    lastAttendance,
    lastAssessment
  };
};

/**
 * Calculates academic risk based on attendance and performance
 * @param {Object} student - Student object
 * @param {Array} attendanceRecords - List of attendance records
 * @param {Array} assessments - List of assessment records
 * @returns {Object} { riskLevel, riskReason }
 */
/**
 * Calculates academic risk based on attendance, performance, and trends
 * @param {Object} student - Student object
 * @param {Array} attendanceRecords - List of attendance records
 * @param {Array} assessments - List of assessment records
 * @returns {Object} { riskLevel, riskReason, riskScore }
 */
export const calculateRisk = (student, attendanceRecords = [], assessments = []) => {
  let riskLevel = 'LOW';
  let riskScore = 0;
  let reasons = [];

  // --- 1. ATTENDANCE ANALYSIS ---
  let attendancePercent = student.attendancePercent;
  if (attendanceRecords.length > 0) {
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    attendancePercent = (present / attendanceRecords.length) * 100;
  }

  // Base attendance risk
  if (attendancePercent < 60) {
    riskLevel = 'HIGH';
    riskScore += 40;
    reasons.push(`Critical attendance shortage (${attendancePercent.toFixed(1)}%)`);
  } else if (attendancePercent < 75) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    riskScore += 20;
    reasons.push(`Low attendance warning (${attendancePercent.toFixed(1)}%)`);
  }

  // Attendance Trend
  const attTrend = analyzeAttendanceTrend(attendanceRecords);
  if (attTrend.trend === 'DECLINING') {
    riskScore += 15;
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    reasons.push('Declining attendance trend');
  }

  // --- 2. ACADEMIC PERFORMANCE (MARKS) ---
  // Check for failed subjects (marks < 33% is a fail)
  const failedAssessments = assessments.filter(a => {
    const percentage = (a.marksObtained / a.totalMarks) * 100;
    return percentage < 33;
  });

  // Repeated failure risk
  if (failedAssessments.length > 2) {
    riskLevel = 'HIGH';
    riskScore += 30;
    reasons.push(`Repeated failures (${failedAssessments.length} exams)`);
  } else if (failedAssessments.length > 0) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    riskScore += 15;
    reasons.push(`Failed in ${failedAssessments.length} assessment(s)`);
  }

  // CGPA Check
  if (student.currentCGPA > 0) {
    if (student.currentCGPA < 5.0) {
      riskLevel = 'HIGH';
      riskScore += 25;
      reasons.push(`Critical academic standing (CGPA: ${student.currentCGPA})`);
    } else if (student.currentCGPA < 6.5) {
      riskScore += 10;
      reasons.push(`Low CGPA (${student.currentCGPA})`);
    }
  }

  // --- 3. SUDDEN PERFORMANCE DROP ---
  const perfDrop = detectPerformanceDrop(assessments);
  if (perfDrop.hasDropped) {
    if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM';
    riskScore += 20;
    reasons.push(`Sudden performance drop (-${perfDrop.dropPercentage.toFixed(1)}%)`);
  }

  // --- 4. BEHAVIORAL RISK ---
  if (student.disciplinaryIssues > 2) {
    riskLevel = 'HIGH';
    riskScore += 25;
    reasons.push(`High disciplinary issues (${student.disciplinaryIssues})`);
  } else if (student.disciplinaryIssues > 0) {
    riskScore += 10;
    reasons.push(`Disciplinary history`);
  }

  // --- 5. INACTIVITY ---
  const inactivity = detectInactivity(attendanceRecords, assessments);
  if (inactivity.missedExams) {
    riskScore += 10;
    reasons.push('Missed recent exams');
  }
  if (inactivity.attendanceGap > 7) {
    riskScore += 10;
    reasons.push(`Long absence gap (${inactivity.attendanceGap} days)`);
  }

  // Final Risk Level Adjustment based on Score
  if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 30 && riskLevel !== 'HIGH') riskLevel = 'MEDIUM';

  return {
    riskLevel,
    riskScore: Math.min(riskScore, 100), // Cap at 100
    riskReason: reasons.length > 0 ? reasons.join('; ') : 'Good standing'
  };
};

/**
 * Calculates comprehensive risk profile with advanced analytics
 * @param {Object} student - Student object with relations
 * @returns {Object} Detailed risk profile
 */
export const calculateComprehensiveRisk = (student) => {
  const { attendanceRecords = [], assessments = [] } = student;

  // Use the unified calculation logic
  const { riskLevel, riskReason, riskScore } = calculateRisk(student, attendanceRecords, assessments);
  
  // Get detailed analytics components for the breakdown
  const attendanceTrend = analyzeAttendanceTrend(attendanceRecords);
  const performanceDrop = detectPerformanceDrop(assessments);
  const inactivity = detectInactivity(attendanceRecords, assessments);

  // Generate recommendations
  const recommendations = [];
  if (riskLevel === 'HIGH') {
    recommendations.push('Immediate counseling session required');
    if (student.attendancePercent < 60) recommendations.push('Parent meeting for attendance');
    if (performanceDrop.hasDropped) recommendations.push('Remedial classes for academic drop');
    if (student.disciplinaryIssues > 2) recommendations.push('Disciplinary committee review');
  } else if (riskLevel === 'MEDIUM') {
    recommendations.push('Monitor progress closely');
    if (attendanceTrend.trend === 'DECLINING') recommendations.push('Student meeting regarding attendance');
    if (inactivity.missedExams) recommendations.push('Check reason for missed exams');
  } else {
    recommendations.push('Maintain current performance');
  }

  return {
    studentId: student.id,
    studentEnrollment: student.studentId,
    studentName: student.name,
    overallRisk: riskLevel,
    riskScore,
    riskReason, // Include the explainable reason
    breakdown: {
      attendance: {
        risk: student.attendancePercent < 60 ? 'HIGH' : student.attendancePercent < 75 ? 'MEDIUM' : 'LOW',
        current: student.attendancePercent.toFixed(1),
        trend: attendanceTrend.trend,
        trendChange: attendanceTrend.percentageChange.toFixed(1)
      },
      academic: {
        risk: student.currentCGPA < 5.0 ? 'HIGH' : student.currentCGPA < 6.5 ? 'MEDIUM' : 'LOW',
        cgpa: student.currentCGPA,
        recentDrop: performanceDrop.hasDropped,
        dropPercentage: performanceDrop.dropPercentage.toFixed(1)
      },
      behavioral: {
        risk: student.disciplinaryIssues > 2 ? 'HIGH' : student.disciplinaryIssues > 0 ? 'MEDIUM' : 'LOW',
        issues: student.disciplinaryIssues
      },
      inactivity: {
        missedExams: inactivity.missedExams,
        attendanceGap: inactivity.attendanceGap,
        lastAttendance: inactivity.lastAttendance,
        lastAssessment: inactivity.lastAssessment
      }
    },
    recommendations,
    lastUpdated: new Date()
  };
};

/**
 * Updates a student's risk profile in the database
 * @param {String} studentId 
 */


export const updateStudentRiskProfile = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendanceRecords: true,
        assessments: true
      }
    });

    if (!student) return;

    // Calculate Comprehensive Risk
    const riskProfile = calculateComprehensiveRisk(student);
    const { overallRisk, riskReason } = riskProfile;

    // Update Student Record
    // Only update if changed significantly
    if (student.dropoutRisk !== overallRisk || 
        student.riskReason !== riskReason) {
      
      await prisma.student.update({
        where: { id: studentId },
        data: {
          dropoutRisk: overallRisk,
          riskReason: riskReason,
          lastAssessment: new Date()
        }
      });
      console.log(`Updated risk for student ${student.studentId}: ${overallRisk}`);

      // Generate Alert if HIGH RISK
      if (overallRisk === 'HIGH') {
        // Check if an unread alert already exists to avoid spam
        const existingAlert = await prisma.alert.findFirst({
          where: {
            studentId: studentId,
            riskLevel: 'HIGH',
            isRead: false,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours cooldown
            }
         }
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              studentId: studentId,
              riskLevel: 'HIGH',
              message: `High dropout risk detected: ${riskReason}`,
              isRead: false
            }
          });
          console.log(`🚨 Alert generated for student ${student.studentId}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error updating risk profile for ${studentId}:`, error);
  }
};


