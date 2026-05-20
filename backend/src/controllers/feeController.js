import { errorResponse, successResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import { importFeesFromCSV } from '../services/feeCSVService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload fees CSV
 * POST /api/fees/upload/csv
 */
export const uploadFeesCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('No file uploaded', 400));
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, `fees_${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const result = await importFeesFromCSV(tempFilePath);

    fs.unlinkSync(tempFilePath);

    logger.info(`Fees CSV uploaded: ${result.imported} records`);

    res.json({
      success: true,
      message: 'Fee records imported successfully',
      data: {
        imported: result.imported,
        total: result.total,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error(`Fees CSV upload error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to upload fees CSV', 500));
  }
};

/**
 * Get all fee records
 * GET /api/fees
 */
export const getAllFees = async (req, res) => {
  try {
    const { paymentStatus, department } = req.query;
    
    const where = {};
    if (paymentStatus) {
      where.paymentStatus = paymentStatus.toUpperCase();
    }

    const fees = await prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true,
            semester: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(successResponse(fees, 'Fee records retrieved successfully'));
  } catch (error) {
    logger.error(`Get fees error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to retrieve fee records', 500));
  }
};

/**
 * Get fee record by student ID
 * GET /api/fees/student/:studentId
 */
export const getFeeByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { studentId },
      select: { id: true }
    });

    if (!student) {
      return res.status(404).json(errorResponse('Student not found', 404));
    }

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { studentId: student.id },
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true
          }
        }
      }
    });

    if (!feeRecord) {
      return res.status(404).json(errorResponse('Fee record not found', 404));
    }

    res.json(successResponse(feeRecord, 'Fee record retrieved successfully'));
  } catch (error) {
    logger.error(`Get fee by student error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to retrieve fee record', 500));
  }
};
