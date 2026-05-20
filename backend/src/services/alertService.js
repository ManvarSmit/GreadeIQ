import prisma from '../config/database.js';

/**
 * Create an alert for a student
 * @param {string} studentId - Student ID
 * @param {string} riskLevel - Risk level (HIGH, MEDIUM, LOW)
 * @param {string} message - Alert message
 * @returns {Promise<Object>} Created alert
 */
export const createAlert = async (studentId, riskLevel, message) => {
  try {
    const alert = await prisma.alert.create({
      data: {
        studentId,
        riskLevel,
        message
      }
    });
    
    console.log(`Alert created for student ${studentId}: ${riskLevel}`);
    return alert;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

/**
 * Trigger HIGH risk alert automatically
 * @param {Object} student - Student object
 * @returns {Promise<Object>} Created alert
 */
export const triggerHighRiskAlert = async (student) => {
  const message = `HIGH RISK: Student ${student.name} (${student.studentId}) requires immediate attention. Risk factors: ${student.riskReason || 'Multiple risk indicators detected'}`;
  
  return createAlert(student.id, 'HIGH', message);
};

/**
 * Get all unread alerts
 * @param {number} limit - Maximum number of alerts to return
 * @returns {Promise<Array>} List of unread alerts
 */
export const getUnreadAlerts = async (limit = 50) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isRead: false },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            department: true,
            dropoutRisk: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return alerts;
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    throw error;
  }
};

/**
 * Mark alert as read
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Updated alert
 */
export const markAlertAsRead = async (alertId) => {
  try {
    return await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true }
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
};
