import fs from 'fs';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Import course attempts from CSV
 * CSV Format: studentId,courseCode,attemptNumber,passFail,grade
 */
export const importAttemptsFromCSV = async (filePath) => {
  const attempts = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          const attempt = {
            studentId: row.studentId?.trim() || row['Student ID']?.trim() || row['student_id']?.trim(),
            courseCode: row.courseCode?.trim().toUpperCase() || row['Course Code']?.trim().toUpperCase(),
            attemptNumber: parseInt(row.attemptNumber || row['Attempt Number']),
            passFail: row.passFail?.trim().toUpperCase() || row['Pass Fail']?.trim().toUpperCase(),
            grade: row.grade?.trim() || row['Grade']?.trim() || null
          };

          // Validate required fields
          if (!attempt.studentId || !attempt.courseCode || isNaN(attempt.attemptNumber)) {
            errors.push({
              row,
              error: 'Missing required fields (studentId, courseCode, attemptNumber, passFail)'
            });
            return;
          }

          // Validate passFail
          const validPassFail = ['PASS', 'FAIL'];
          if (!validPassFail.includes(attempt.passFail)) {
            errors.push({
              row,
              error: `Invalid passFail. Must be PASS or FAIL`
            });
            return;
          }

          attempts.push(attempt);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          // Verify students exist
          const studentIds = [...new Set(attempts.map(a => a.studentId))];
          const students = await prisma.student.findMany({
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true }
          });

          const studentMap = new Map(students.map(s => [s.studentId, s.id]));
          
          // Map studentId to database ID
          const attemptsWithIds = attempts
            .filter(a => studentMap.has(a.studentId))
            .map(a => ({
              ...a,
              studentId: studentMap.get(a.studentId)
            }));

          // Bulk create attempts
          const created = await prisma.courseAttempt.createMany({
            data: attemptsWithIds,
            skipDuplicates: true
          });

          logger.info(`CSV Import: ${created.count} course attempts imported`);

          resolve({
            success: true,
            imported: created.count,
            total: attempts.length,
            errors: errors.length,
            errorDetails: errors
          });
        } catch (error) {
          logger.error(`CSV Import Error: ${error.message}`);
          reject(error);
        }
      })
      .on('error', (error) => {
        logger.error(`CSV Read Error: ${error.message}`);
        reject(error);
      });
  });
};

/**
 * Export course attempts to CSV
 */
export const exportAttemptsToCSV = async (outputPath, filters = {}) => {
  try {
    const where = {};
    
    if (filters.studentId) {
      const student = await prisma.student.findUnique({
        where: { studentId: filters.studentId },
        select: { id: true }
      });
      if (student) where.studentId = student.id;
    }

    if (filters.passFail) {
      where.passFail = filters.passFail.toUpperCase();
    }

    const attempts = await prisma.courseAttempt.findMany({
      where,
      include: {
        student: {
          select: { studentId: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const writeStream = fs.createWriteStream(outputPath);
    const csvStream = format({ headers: true });
    csvStream.pipe(writeStream);

    attempts.forEach(attempt => {
      csvStream.write({
        studentId: attempt.student.studentId,
        studentName: attempt.student.name,
        courseCode: attempt.courseCode,
        attemptNumber: attempt.attemptNumber,
        passFail: attempt.passFail,
        grade: attempt.grade || ''
      });
    });

    csvStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        logger.info(`CSV Export: ${attempts.length} course attempts exported`);
        resolve({
          success: true,
          exported: attempts.length,
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
  importAttemptsFromCSV,
  exportAttemptsToCSV
};
