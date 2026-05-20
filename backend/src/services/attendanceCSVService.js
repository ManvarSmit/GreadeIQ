import fs from 'fs';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { updateStudentRiskProfile } from './riskEngine.js';

/**
 * Import attendance records from CSV
 * CSV Format: studentId,date,status,remarks
 */
export const importAttendanceFromCSV = async (filePath) => {
  const records = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          const record = {
            studentId: row.studentId?.trim() || row['Student ID']?.trim() || row['student_id']?.trim(),
            date: row.date ? new Date(row.date) : null,
            status: row.status?.trim().toUpperCase() || row['Status']?.trim().toUpperCase()
          };

          // Validate required fields
          if (!record.studentId || !record.date || !record.status) {
            errors.push({
              row,
              error: 'Missing required fields (studentId, date, status)'
            });
            return;
          }

          // Validate status
          const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
          if (!validStatuses.includes(record.status)) {
            errors.push({
              row,
              error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
            return;
          }

          records.push(record);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          // First, verify all students exist
          const studentIds = [...new Set(records.map(r => r.studentId))];
          const students = await prisma.student.findMany({
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true }
          });

          const studentMap = new Map(students.map(s => [s.studentId, s.id]));
          
          // Map studentId to database ID
          const recordsWithIds = records
            .filter(r => studentMap.has(r.studentId))
            .map(r => ({
              ...r,
              studentId: studentMap.get(r.studentId)
            }));

          // Bulk create attendance records
          const created = await prisma.attendance.createMany({
            data: recordsWithIds,
            skipDuplicates: true
          });

          logger.info(`CSV Import: ${created.count} attendance records imported`);

          // Update aggregated attendance percentage and risk profile for affected students
          const affectedStudentIds = [...new Set(recordsWithIds.map(r => r.studentId))];
          
          // Process updates in background to avoid timeout
          (async () => {
            logger.info(`Starting risk profile updates for ${affectedStudentIds.length} students...`);
            for (const studentId of affectedStudentIds) {
              try {
                // Update aggregated attendance percentage
                const records = await prisma.attendance.findMany({
                   where: { studentId }
                });
                if (records.length > 0) {
                  const present = records.filter(r => r.status === 'PRESENT').length;
                  const percent = (present / records.length) * 100;
                  
                  await prisma.student.update({
                    where: { id: studentId },
                    data: { attendancePercent: percent }
                  });
                }

                // Update risk profile
                await updateStudentRiskProfile(studentId);
              } catch (err) {
                logger.error(`Error updating post-import data for student ${studentId}: ${err.message}`);
              }
            }
            logger.info('Risk profile updates completed');
          })();

          resolve({
            success: true,
            imported: created.count,
            total: records.length,
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
 * Export attendance records to CSV
 */
export const exportAttendanceToCSV = async (outputPath, filters = {}) => {
  try {
    const where = {};
    
    if (filters.studentId) {
      const student = await prisma.student.findUnique({
        where: { studentId: filters.studentId },
        select: { id: true }
      });
      if (student) where.studentId = student.id;
    }

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { studentId: true, name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    const writeStream = fs.createWriteStream(outputPath);
    const csvStream = format({ headers: true });
    csvStream.pipe(writeStream);

    records.forEach(record => {
      csvStream.write({
        studentId: record.student.studentId,
        studentName: record.student.name,
        date: record.date.toISOString().split('T')[0],
        status: record.status
      });
    });

    csvStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        logger.info(`CSV Export: ${records.length} attendance records exported`);
        resolve({
          success: true,
          exported: records.length,
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
  importAttendanceFromCSV,
  exportAttendanceToCSV
};
