import fs from 'fs';
import csvParser from 'csv-parser';
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

export default {
  importAttemptsFromCSV
};
