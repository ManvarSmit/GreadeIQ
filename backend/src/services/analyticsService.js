import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get department-wise risk analytics
 * @param {number} [semester] - Optional semester filter
 */
export const getDepartmentRiskAnalytics = async (semester) => {
  try {
    const where = {};
    if (semester) {
      where.semester = parseInt(semester);
    }

    // Get all students with their risk status
    const students = await prisma.student.findMany({
      where,
      select: {
        department: true,
        dropoutRisk: true
      }
    });

    // Group by department
    const departmentData = {};

    students.forEach(student => {
      const dept = student.department;
      if (!departmentData[dept]) {
        departmentData[dept] = {
          department: dept,
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          avgRiskScore: 0,
          riskScores: []
        };
      }

      departmentData[dept].total++;
      
      const riskLevel = student.dropoutRisk || 'LOW';
      if (riskLevel === 'HIGH') departmentData[dept].high++;
      else if (riskLevel === 'MEDIUM') departmentData[dept].medium++;
      else departmentData[dept].low++;

      // Use a derived score based on risk level for analytics (0-100)
      let score = 20; // Default LOW
      if (riskLevel === 'HIGH') score = 80;
      else if (riskLevel === 'MEDIUM') score = 50;
      
      departmentData[dept].riskScores.push(score);
    });

    // Calculate averages
    const result = Object.values(departmentData).map(dept => {
      const avgScore = dept.riskScores.length > 0
        ? dept.riskScores.reduce((a, b) => a + b, 0) / dept.riskScores.length
        : 0;

      return {
        department: dept.department,
        total: dept.total,
        high: dept.high,
        medium: dept.medium,
        low: dept.low,
        highPercent: dept.total > 0 ? Math.round((dept.high / dept.total) * 100) : 0,
        mediumPercent: dept.total > 0 ? Math.round((dept.medium / dept.total) * 100) : 0,
        lowPercent: dept.total > 0 ? Math.round((dept.low / dept.total) * 100) : 0,
        avgRiskScore: Math.round(avgScore * 10) / 10
      };
    });

    logger.info(`Department risk analytics generated (Semester: ${semester || 'All'})`);
    return result;
  } catch (error) {
    logger.error(`Department risk analytics error: ${error.message}`);
    throw error;
  }
};

/**
 * Get subject-wise failure heatmap data (unchanged)
 */
export const getSubjectFailureHeatmap = async () => {
  try {
    // Get all academic records - Assuming AcademicRecord model exists or needs verification
    // But keeping as is for now if verified elsewhere, otherwise use Assessment
    const records = await prisma.assessment.findMany({
      include: {
        student: {
          select: {
            department: true
          }
        }
      }
    });

    // Group by subject and department
    const heatmapData = {};

    records.forEach(record => {
      const subject = record.subject;
      const dept = record.student.department;
      const key = `${subject}|${dept}`;

      if (!heatmapData[key]) {
        heatmapData[key] = {
          subject,
          department: dept,
          total: 0,
          failures: 0,
          avgMarks: 0,
          marks: []
        };
      }

      heatmapData[key].total++;
      heatmapData[key].marks.push(record.marksObtained);
      
      // Consider < 40% as failure
      const percentage = (record.marksObtained / record.totalMarks) * 100;
      if (percentage < 40) {
        heatmapData[key].failures++;
      }
    });

    // Calculate failure rates
    const result = Object.values(heatmapData).map(item => {
      const avgMarks = item.marks.reduce((a, b) => a + b, 0) / item.marks.length;
      const failureRate = item.total > 0 ? (item.failures / item.total) * 100 : 0;

      return {
        subject: item.subject,
        department: item.department,
        total: item.total,
        failures: item.failures,
        failureRate: Math.round(failureRate * 10) / 10,
        avgMarks: Math.round(avgMarks * 10) / 10,
        severity: failureRate > 30 ? 'HIGH' : failureRate > 15 ? 'MEDIUM' : 'LOW'
      };
    });

    // Sort by failure rate descending
    result.sort((a, b) => b.failureRate - a.failureRate);

    logger.info('Subject failure heatmap generated');
    return result;
  } catch (error) {
    logger.error(`Subject failure heatmap error: ${error.message}`);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

/**
 * Get semester transition analysis
 */
export const getSemesterTransitionData = async () => {
  try {
    // Get students grouped by semester
    const semesterData = await prisma.student.groupBy({
      by: ['semester'],
      _count: {
        id: true
      },
      _avg: {
        currentCGPA: true,
        attendancePercent: true
      }
    });

    // Get risk distribution per semester
    const students = await prisma.student.findMany({
      select: {
        semester: true,
        dropoutRisk: true
      }
    });

    const semesterRisk = {};
    students.forEach(student => {
      const sem = student.semester;
      if (!semesterRisk[sem]) {
        semesterRisk[sem] = { high: 0, medium: 0, low: 0 };
      }
      
      const risk = student.dropoutRisk || 'LOW';
      if (risk === 'HIGH') semesterRisk[sem].high++;
      else if (risk === 'MEDIUM') semesterRisk[sem].medium++;
      else semesterRisk[sem].low++;
    });

    // Combine data
    const result = semesterData.map(sem => ({
      semester: sem.semester,
      students: sem._count.id,
      avgCGPA: Math.round((sem._avg.currentCGPA || 0) * 100) / 100,
      avgAttendance: Math.round((sem._avg.attendancePercent || 0) * 10) / 10,
      highRisk: semesterRisk[sem.semester]?.high || 0,
      mediumRisk: semesterRisk[sem.semester]?.medium || 0,
      lowRisk: semesterRisk[sem.semester]?.low || 0,
      dropoutRate: 0 // Can be calculated based on historical data
    }));

    // Sort by semester
    result.sort((a, b) => a.semester - b.semester);

    logger.info('Semester transition analysis generated');
    return result;
  } catch (error) {
    logger.error(`Semester transition analysis error: ${error.message}`);
    return [];
  }
};

/**
 * Get admin insights (comprehensive dashboard data)
 * @param {number} [semester] - Optional semester filter
 */
export const getAdminInsights = async (semester) => {
  try {
    const where = {};
    if (semester) {
      where.semester = parseInt(semester);
    }

    // Get overall statistics
    const totalStudents = await prisma.student.count({ where });
    
    // Total departments (affected by students in that semester)
    // Note: groupBy with where clause
    const totalDepartments = await prisma.student.groupBy({
      by: ['department'],
      where
    });

    // Get risk distribution directly from Student model
    const riskProfiles = await prisma.student.groupBy({
      by: ['dropoutRisk'],
      where,
      _count: {
        id: true
      }
    });

    const riskDistribution = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      UNKNOWN: 0
    };
    
    riskProfiles.forEach(rp => {
      if (rp.dropoutRisk) {
        riskDistribution[rp.dropoutRisk] = rp._count.id;
      }
    });

    // Get recent interventions (if model exists)
    // Interventions are harder to filter by student semester unless we join
    // For now, keeping global or if we want strict filtering we need to fetch intervention tasks for students in that semester
    let recentInterventions = 0;
    try {
      // If semester filtering is active, we might want to only count interventions for students in that semester
      // But for simplicity/performance let's keep it global or filter if needed
      // Let's filter if semester is provided
      const interventionWhere = {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      };
      
      if (semester) {
        interventionWhere.student = {
          semester: parseInt(semester)
        };
      }

      recentInterventions = await prisma.interventionTask.count({
        where: interventionWhere
      });
    } catch (e) {
      logger.warn('InterventionTask model might not exist or be empty');
    }

    // Get counseling sessions (if model exists)
    let counselingSessions = 0;
    try {
       const counselingWhere = {};
       if (semester) {
        counselingWhere.student = {
          semester: parseInt(semester)
        };
       }
      counselingSessions = await prisma.counselingLog.count({
        where: counselingWhere
      });
    } catch (e) {
      logger.warn('CounselingLog model might not exist or be empty');
    }

    // Get average metrics
    const avgMetrics = await prisma.student.aggregate({
      where,
      _avg: {
        currentCGPA: true,
        attendancePercent: true
      }
    });

    // Get department-wise data (reuse function with semester)
    const departmentRisk = await getDepartmentRiskAnalytics(semester);

    const insights = {
      overview: {
        totalStudents,
        totalDepartments: totalDepartments.length,
        highRiskStudents: riskDistribution.HIGH || 0,
        mediumRiskStudents: riskDistribution.MEDIUM || 0,
        lowRiskStudents: riskDistribution.LOW || 0,
        avgCGPA: Math.round((avgMetrics._avg.currentCGPA || 0) * 100) / 100,
        avgAttendance: Math.round((avgMetrics._avg.attendancePercent || 0) * 10) / 10
      },
      interventions: {
        total: recentInterventions,
        counselingSessions
      },
      departmentRisk: departmentRisk.slice(0, 5), // Top 5 departments
      trends: {
        riskTrend: 'stable', 
        attendanceTrend: 'improving',
        cgpaTrend: 'stable'
      }
    };

    logger.info(`Admin insights generated (Semester: ${semester || 'All'})`);
    return insights;
  } catch (error) {
    logger.error(`Admin insights error: ${error.message}`);
    throw error;
  }
};

export default {
  getDepartmentRiskAnalytics,
  getSubjectFailureHeatmap,
  getSemesterTransitionData,
  getAdminInsights
};
