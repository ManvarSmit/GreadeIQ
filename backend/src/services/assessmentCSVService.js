import fs from 'fs';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { updateStudentRiskProfile } from './riskEngine.js';

/**
 * Import assessments from CSV
 * CSV Format: studentId,assessmentType,subject,totalMarks,marksObtained,date
 */
export const importAssessmentsFromCSV = async (filePath) => {
  const assessments = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          const assessment = {
            studentId: row.studentId?.trim() || row['Student ID']?.trim() || row['student_id']?.trim(),
            assessmentType: row.assessmentType?.trim().toUpperCase() || row['Assessment Type']?.trim().toUpperCase(),
            subject: row.subject?.trim() || row['Subject']?.trim(),
            totalMarks: parseFloat(row.totalMarks || row['Total Marks']),
            marksObtained: parseFloat(row.marksObtained || row['Marks Obtained']),
            date: row.date ? new Date(row.date) : null
          };

          // Validate required fields
          if (!assessment.studentId || !assessment.assessmentType || !assessment.subject || isNaN(assessment.totalMarks) || isNaN(assessment.marksObtained) || !assessment.date) {
            errors.push({
              row,
              error: 'Missing required fields or invalid numeric values'
            });
            return;
          }
          // Validate assessment type
          const validTypes = ['MID_TERM', 'END_TERM', 'ASSIGNMENT', 'QUIZ', 'PROJECT'];
          if (!validTypes.includes(assessment.assessmentType)) {
            errors.push({
              row,
              error: `Invalid assessmentType. Must be one of: ${validTypes.join(', ')}`
            });
            return;
          }

          // Validate marks
          if (assessment.marksObtained > assessment.totalMarks) {
            errors.push({
              row,
              error: 'Marks obtained cannot exceed total marks'
            });
            return;
          }

          assessments.push(assessment);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          // Verify students exist
          const studentIds = [...new Set(assessments.map(a => a.studentId))];
          const students = await prisma.student.findMany({
            where: { studentId: { in: studentIds } },
            select: { id: true, studentId: true }
          });

          const studentMap = new Map(students.map(s => [s.studentId, s.id]));
          
          // Map studentId to database ID
          const assessmentsWithIds = assessments
            .filter(a => studentMap.has(a.studentId))
            .map(a => ({
              ...a,
              studentId: studentMap.get(a.studentId)
            }));

          // Bulk create assessments
          const created = await prisma.assessment.createMany({
            data: assessmentsWithIds,
            skipDuplicates: true
          });

          logger.info(`CSV Import: ${created.count} assessments imported`);

          // Update aggregated CGPA and risk profile for affected students
          const affectedStudentIds = [...new Set(assessmentsWithIds.map(a => a.studentId))];
          
          (async () => {
             logger.info(`Starting risk profile updates for ${affectedStudentIds.length} students...`);
             for (const studentId of affectedStudentIds) {
               try {
                 // Update aggregated CGPA
                 // Note: Ideally CGPA calculation should be more complex based on credits
                 // Simplified here as average of percentages
                 const studentAssessments = await prisma.assessment.findMany({
                   where: { studentId }
                 });
                 
                 if (studentAssessments.length > 0) {
                   const totalPercent = studentAssessments.reduce((sum, a) => sum + (a.marksObtained / a.totalMarks) * 100, 0);
                   const avgPercent = totalPercent / studentAssessments.length;
                   // Convert to 10-point scale approx
                   const cgpa = (avgPercent / 9.5).toFixed(2);
                   
                   await prisma.student.update({
                     where: { id: studentId },
                     data: { currentCGPA: parseFloat(cgpa) }
                   });
                 }

                 // Update Risk Profile
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
            total: assessments.length,
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
 * Export assessments to CSV
 */
export const exportAssessmentsToCSV = async (outputPath, filters = {}) => {
  try {
    const where = {};
    
    if (filters.studentId) {
      const student = await prisma.student.findUnique({
        where: { studentId: filters.studentId },
        select: { id: true }
      });
      if (student) where.studentId = student.id;
    }

    if (filters.assessmentType) {
      where.assessmentType = filters.assessmentType.toUpperCase();
    }

    const assessments = await prisma.assessment.findMany({
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

    assessments.forEach(assessment => {
      csvStream.write({
        studentId: assessment.student.studentId,
        studentName: assessment.student.name,
        assessmentType: assessment.assessmentType,
        subject: assessment.subject,
        totalMarks: assessment.totalMarks,
        marksObtained: assessment.marksObtained,
        percentage: ((assessment.marksObtained / assessment.totalMarks) * 100).toFixed(2),
        date: assessment.date.toISOString().split('T')[0]
      });
    });

    csvStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        logger.info(`CSV Export: ${assessments.length} assessments exported`);
        resolve({
          success: true,
          exported: assessments.length,
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
  importAssessmentsFromCSV,
  exportAssessmentsToCSV
};
