import fs from 'fs';
import { format } from 'fast-csv';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { calculateRisk } from './riskEngine.js';

/**
 * Export students to CSV file
 */
export const exportStudentsToCSV = async (outputPath, filters = {}) => {
  try {
    // Build query with filters
    const where = {};

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.semester) {
      where.semester = parseInt(filters.semester);
    }

    if (filters.riskLevel) {
      where.dropoutRisk = filters.riskLevel;
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where,
      include: {
        attendanceRecords: true,
        assessments: true
      }
    });

    // Create write stream
    const writeStream = fs.createWriteStream(outputPath);
    const csvStream = format({ headers: true });

    csvStream.pipe(writeStream);

    // Write student data
    students.forEach(student => {
      // Calculate risk score dynamically
      const { riskScore } = calculateRisk(student, student.attendanceRecords, student.assessments);

      csvStream.write({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        department: student.department,
        semester: student.semester,
        currentCGPA: student.currentCGPA,
        attendancePercent: student.attendancePercent,
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : '',
        gender: student.gender || '',
        familyIncome: student.familyIncome || '',
        parentEducation: student.parentEducation || '',
        riskLevel: student.dropoutRisk || 'N/A',
        riskScore: riskScore || 0
      });
    });

    csvStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        logger.info(`CSV Export: ${students.length} students exported to ${outputPath}`);
        resolve({
          success: true,
          exported: students.length,
          filePath: outputPath
        });
      });

      writeStream.on('error', (error) => {
        logger.error(`CSV Export Error: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    logger.error(`CSV Export Error: ${error.message}`);
    throw error;
  }
};

export default {
  exportStudentsToCSV
};
