import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Clear all data from the database
 * WARNING: This permanently deletes all records
 */
export const clearAllData = async (req, res) => {
  try {
    logger.warn('Clear all data requested - Starting deletion process');

    // Use transaction to ensure all-or-nothing deletion
    const result = await prisma.$transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      // Delete dependent records first
      const deletedInterventions = await tx.interventionTask.deleteMany({});
      const deletedCounseling = await tx.counselingLog.deleteMany({});
      const deletedFees = await tx.feeRecord.deleteMany({});
      const deletedAttempts = await tx.courseAttempt.deleteMany({});
      const deletedAssessments = await tx.assessment.deleteMany({});
      const deletedAttendance = await tx.attendance.deleteMany({});
      
      // Delete students last (they are referenced by other tables)
      const deletedStudents = await tx.student.deleteMany({});

      return {
        students: deletedStudents.count,
        attendance: deletedAttendance.count,
        assessments: deletedAssessments.count,
        courseAttempts: deletedAttempts.count,
        feeRecords: deletedFees.count,
        counselingLogs: deletedCounseling.count,
        interventionTasks: deletedInterventions.count
      };
    });

    const totalDeleted = Object.values(result).reduce((sum, count) => sum + count, 0);

    logger.warn(`All data cleared successfully. Total records deleted: ${totalDeleted}`, result);

    res.json(successResponse(
      {
        deleted: result,
        totalRecords: totalDeleted
      },
      'All data cleared successfully'
    ));
  } catch (error) {
    logger.error(`Clear all data error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to clear data', 500));
  }
};

export default {
  clearAllData
};
