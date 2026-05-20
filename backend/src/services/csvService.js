import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Import students from CSV file
 * CSV Format: studentId,name,email,phone,department,semester,currentCGPA,attendancePercent
 */
export const importStudentsFromCSV = async (filePath) => {
  const students = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        try {
          // Validate required fields
          if (!row.studentId || !row.name || !row.email || !row.department) {
            errors.push({
              row,
              error: 'Missing required fields (studentId, name, email, department)'
            });
            return;
          }

          // Parse and validate data
          const student = {
            studentId: row.studentId.trim(),
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            phone: row.phone?.trim() || null,
            department: row.department.trim(),
            semester: parseInt(row.semester) || 1,
            currentCGPA: parseFloat(row.currentCGPA) || 0.0,
            attendancePercent: parseFloat(row.attendancePercent) || 0.0,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            gender: row.gender?.trim() || null,
            familyIncome: row.familyIncome ? parseFloat(row.familyIncome) : null,
            parentEducation: row.parentEducation?.trim() || null,
          };

          students.push(student);
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', async () => {
        try {
          // Bulk create students
          const created = await prisma.student.createMany({
            data: students,
            skipDuplicates: true, // Skip if studentId or email already exists
          });

          logger.info(`CSV Import: ${created.count} students imported successfully`);

          resolve({
            success: true,
            imported: created.count,
            total: students.length,
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
      // Join with RiskProfile if filtering by risk
      const riskProfiles = await prisma.riskProfile.findMany({
        where: { riskLevel: filters.riskLevel },
        select: { studentId: true }
      });
      where.id = { in: riskProfiles.map(rp => rp.studentId) };
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where,
      include: {
        riskProfile: {
          select: {
            riskLevel: true,
            riskScore: true
          }
        }
      }
    });

    // Create write stream
    const writeStream = fs.createWriteStream(outputPath);
    const csvStream = format({ headers: true });

    csvStream.pipe(writeStream);

    // Write student data
    students.forEach(student => {
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
        riskLevel: student.riskProfile?.riskLevel || 'N/A',
        riskScore: student.riskProfile?.riskScore || 0
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

/**
 * Generate CSV template for student import
 */
export const generateCSVTemplate = (outputPath) => {
  const writeStream = fs.createWriteStream(outputPath);
  const csvStream = format({ headers: true });

  csvStream.pipe(writeStream);

  // Write sample rows
  const sampleStudents = [
    {
      studentId: 'ME2023001',
      name: 'Kunal Joshi',
      email: '24me050@charusat.edu.in',
      phone: '9156715214',
      department: 'ME',
      semester: 4,
      currentCGPA: 6.8,
      attendancePercent: 58,
      dateOfBirth: '2002-03-10',
      gender: 'Male',
      familyIncome: '50000',
      parentEducation: 'Graduate'
    },
    {
      studentId: 'CS2023089',
      name: 'Priya Sharma',
      email: '24cs089@charusat.edu.in',
      phone: '9876543210',
      department: 'CS',
      semester: 6,
      currentCGPA: 7.2,
      attendancePercent: 72,
      dateOfBirth: '2001-11-22',
      gender: 'Female',
      familyIncome: '65000',
      parentEducation: 'Postgraduate'
    }
  ];

  sampleStudents.forEach(student => {
    csvStream.write(student);
  });

  csvStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      logger.info(`CSV Template generated: ${outputPath}`);
      resolve({
        success: true,
        filePath: outputPath
      });
    });

    writeStream.on('error', (error) => {
      logger.error(`CSV Template Error: ${error.message}`);
      reject(error);
    });
  });
};

/**
 * Validate CSV file format
 */
export const validateCSV = async (filePath) => {
  const requiredFields = ['studentId', 'name', 'email', 'department'];
  const headers = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headerList) => {
        headers.push(...headerList);

        // Check for required fields
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          errors.push(`Missing required columns: ${missingFields.join(', ')}`);
        }
      })
      .on('data', () => { }) // Just validate headers, don't process data
      .on('end', () => {
        resolve({
          valid: errors.length === 0,
          headers,
          errors
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

export default {
  importStudentsFromCSV,
  exportStudentsToCSV,
  generateCSVTemplate,
  validateCSV
};
