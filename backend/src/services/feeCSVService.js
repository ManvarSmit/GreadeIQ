import fs from 'fs';
import csvParser from 'csv-parser';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Import fee records from CSV
 * CSV Format: studentId,totalFees,feesPaid,feesPending,paymentStatus,lastPaymentDate
 */
export const importFeesFromCSV = async (filePath) => {
  const feeRecords = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          const totalFees = parseFloat(row.totalFees || row['Total Fees']);
          const feesPaid = parseFloat(row.feesPaid || row['Fees Paid']);
          let feesPending = row.feesPending ? parseFloat(row.feesPending) : parseFloat(row['Fees Pending']);
          
          if (isNaN(feesPending)) {
            feesPending = totalFees - feesPaid;
          }

          const feeRecord = {
            studentId: row.studentId?.trim() || row['Student ID']?.trim() || row['student_id']?.trim(),
            totalFees,
            feesPaid,
            feesPending,
            paymentStatus: row.paymentStatus?.trim().toUpperCase() || row['Payment Status']?.trim().toUpperCase(),
            lastPaymentDate: row.lastPaymentDate ? new Date(row.lastPaymentDate) : (row['Last Payment Date'] ? new Date(row['Last Payment Date']) : null)
          };

          // Validate payment status
          const validStatuses = ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'];
          if (!validStatuses.includes(feeRecord.paymentStatus)) {
            errors.push({
              row,
              error: `Invalid paymentStatus. Must be one of: ${validStatuses.join(', ')}`
            });
            return;
          }

           // Validate amounts
          if (feeRecord.feesPaid > feeRecord.totalFees) {
            errors.push({
              row,
              error: 'Fees paid cannot exceed total fees'
            });
            return;
          }

          // Validate required fields
          if (!feeRecord.studentId || isNaN(feeRecord.totalFees) || isNaN(feeRecord.feesPaid) || !feeRecord.paymentStatus) {
            errors.push({
              row,
              error: 'Missing required fields (studentId, totalFees, feesPaid, paymentStatus)'
            });
            return;
          }

          feeRecords.push(feeRecord);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          // Verify students exist
          const studentIds = [...new Set(feeRecords.map(f => f.studentId))];
          const students = await prisma.student.findMany({
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true }
          });

          const studentMap = new Map(students.map(s => [s.studentId, s.id]));
          
          // Map studentId to database ID and upsert
          const operations = feeRecords
            .filter(f => studentMap.has(f.studentId))
            .map(f => {
              const dbStudentId = studentMap.get(f.studentId);
              return prisma.feeRecord.upsert({
                where: { studentId: dbStudentId },
                update: {
                  totalFees: f.totalFees,
                  feesPaid: f.feesPaid,
                  feesPending: f.feesPending,
                  paymentStatus: f.paymentStatus,
                  lastPaymentDate: f.lastPaymentDate
                },
                create: {
                  studentId: dbStudentId,
                  totalFees: f.totalFees,
                  feesPaid: f.feesPaid,
                  feesPending: f.feesPending,
                  paymentStatus: f.paymentStatus,
                  lastPaymentDate: f.lastPaymentDate
                }
              });
            });

          // Execute all upserts
          await prisma.$transaction(operations);

          logger.info(`CSV Import: ${operations.length} fee records imported/updated`);

          resolve({
            success: true,
            imported: operations.length,
            total: feeRecords.length,
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
  importFeesFromCSV
};
