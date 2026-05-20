import prisma from '../config/database.js';
import { errorResponse, successResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import { importAttendanceFromCSV } from '../services/attendanceCSVService.js';
import { importAssessmentsFromCSV } from '../services/assessmentCSVService.js';
import { importAttemptsFromCSV } from '../services/attemptCSVService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload attendance CSV
 * POST /api/attendance/upload/csv
 */
export const uploadAttendanceCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', 400));
    }

    // Save file temporarily
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, `attendance_${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Import from CSV
    const result = await importAttendanceFromCSV(tempFilePath);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    logger.info(`Attendance CSV uploaded: ${result.imported} records`);

    res.json({
      success: true,
      message: 'Attendance records imported successfully',
      data: {
        imported: result.imported,
        total: result.total,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error(`Attendance CSV upload error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to upload attendance CSV', 500));
  }
};

/**
 * Upload assessments CSV
 * POST /api/academic/assessments/upload/csv
 */
export const uploadAssessmentsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', 400));
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, `assessments_${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const result = await importAssessmentsFromCSV(tempFilePath);

    fs.unlinkSync(tempFilePath);

    logger.info(`Assessments CSV uploaded: ${result.imported} records`);

    res.json({
      success: true,
      message: 'Assessments imported successfully',
      data: {
        imported: result.imported,
        total: result.total,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error(`Assessments CSV upload error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to upload assessments CSV', 500));
  }
};

/**
 * Upload course attempts CSV
 * POST /api/academic/attempts/upload/csv
 */
export const uploadAttemptsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', 400));
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, `attempts_${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const result = await importAttemptsFromCSV(tempFilePath);

    fs.unlinkSync(tempFilePath);

    logger.info(`Course attempts CSV uploaded: ${result.imported} records`);

    res.json({
      success: true,
      message: 'Course attempts imported successfully',
      data: {
        imported: result.imported,
        total: result.total,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error(`Attempts CSV upload error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to upload attempts CSV', 500));
  }
};

import csv from 'csv-parser';
import { Readable } from 'stream';
import { updateStudentRiskProfile } from '../services/riskEngine.js';

// Add single attendance record
export const addAttendance = async (req, res) => {
  try {
    const { studentId, date, status, subject } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        date: new Date(date),
        status,
        subject
      }
    });

    // Update aggregated attendance percentage
    await updateStudentAttendance(studentId);
    
    // Recalculate Risk Profile
    await updateStudentRiskProfile(studentId);

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Add attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: error.message
    });
  }
};

// Add single assessment record
export const addAssessment = async (req, res) => {
  try {
    const { studentId, subject, examType, marksObtained, totalMarks, date } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        subject,
        examType,
        marksObtained,
        totalMarks,
        date: new Date(date)
      }
    });

    // Recalculate Risk Profile
    await updateStudentRiskProfile(studentId);

    res.status(201).json({
      success: true,
      message: 'Assessment recorded successfully',
      data: assessment
    });
  } catch (error) {
    console.error('Add assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording assessment',
      error: error.message
    });
  }
};

// Get full student academic profile (Merged Data)
export const getStudentAcademicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 50 // Last 50 records
        },
        assessments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate aggregated stats safely
    const assessmentStats = student.assessments.reduce((acc, curr) => {
      acc.totalObtained += curr.marksObtained;
      acc.maxMarks += curr.totalMarks;
      return acc;
    }, { totalObtained: 0, maxMarks: 0 });

    const overallPercentage = assessmentStats.maxMarks > 0 
      ? (assessmentStats.totalObtained / assessmentStats.maxMarks) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...student,
        academicSummary: {
          overallPercentage: overallPercentage.toFixed(2),
          totalAssessments: student.assessments.length,
          totalAttendanceRecords: student.attendanceRecords.length
        }
      }
    });
  } catch (error) {
    console.error('Get academic profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching academic profile',
      error: error.message
    });
  }
};

// Helper to update student attendance percentage
const updateStudentAttendance = async (studentId) => {
  const records = await prisma.attendance.findMany({
    where: { studentId }
  });

  if (records.length === 0) return;

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const percentage = (presentCount / records.length) * 100;

  await prisma.student.update({
    where: { id: studentId },
    data: { attendancePercent: percentage }
  });
};

// Bulk upload attendance
export const bulkUploadAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const records = [];
    const errors = [];
    let lineNumber = 1;

    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', async (row) => {
        lineNumber++;
        // Expected format: studentId (enrollment), date, status, subject
        try {
          // Find student UUID by enrollment ID
          const student = await prisma.student.findUnique({
            where: { studentId: row.studentId }
          });

          if (student) {
            records.push({
              studentId: student.id,
              date: new Date(row.date),
              status: row.status?.toUpperCase(),
              subject: row.subject
            });
          } else {
            errors.push({ line: lineNumber, message: `Student ID ${row.studentId} not found` });
          }
        } catch (err) {
          errors.push({ line: lineNumber, message: err.message });
        }
      })
      .on('end', async () => {
        if (records.length > 0) {
          await prisma.attendance.createMany({ data: records });
          
          // Trigger updates for affected students (background)
          const uniqueStudentIds = [...new Set(records.map(r => r.studentId))];
          
          // Process updates in sequence to avoid DB locks
          for (const id of uniqueStudentIds) {
            await updateStudentAttendance(id);
            await updateStudentRiskProfile(id);
          }
        }

        res.status(201).json({
          success: true,
          message: `Processed ${records.length} records`,
          errors: errors.length > 0 ? errors : undefined
        });
      });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};

// Bulk upload assessments
export const bulkUploadAssessments = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const records = [];
    const errors = [];
    let lineNumber = 1;

    const stream = Readable.from(req.file.buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', async (row) => {
        lineNumber++;
        try {
           const student = await prisma.student.findUnique({
            where: { studentId: row.studentId }
          });

          if (student) {
            records.push({
              studentId: student.id,
              subject: row.subject,
              examType: row.examType,
              marksObtained: parseFloat(row.marksObtained),
              totalMarks: parseFloat(row.totalMarks),
              date: new Date(row.date)
            });
          } else {
            errors.push({ line: lineNumber, message: `Student ID ${row.studentId} not found` });
          }
        } catch (err) {
          errors.push({ line: lineNumber, message: err.message });
        }
      })
      .on('end', async () => {
        if (records.length > 0) {
          await prisma.assessment.createMany({ data: records });
          
           // Trigger risk updates
           const uniqueStudentIds = [...new Set(records.map(r => r.studentId))];
           for (const id of uniqueStudentIds) {
             await updateStudentRiskProfile(id);
           }
        }

        res.status(201).json({
          success: true,
          message: `Processed ${records.length} assessments`,
          errors: errors.length > 0 ? errors : undefined
        });
      });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};
