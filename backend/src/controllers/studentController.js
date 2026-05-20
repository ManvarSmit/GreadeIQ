import prisma from '../config/database.js';
import fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Create a new student
export const createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // Check if student ID or email already exists
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId: studentData.studentId },
          { email: studentData.email }
        ]
      }
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this ID or email already exists'
      });
    }

    // Convert date string to Date object if provided
    if (studentData.dateOfBirth) {
      studentData.dateOfBirth = new Date(studentData.dateOfBirth);
    }

    const student = await prisma.student.create({
      data: studentData
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
};

// Get all students with pagination and filters
export const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      semester,
      dropoutRisk,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter conditions
    const where = {};

    if (department) where.department = department;
    if (semester) where.semester = parseInt(semester);
    if (dropoutRisk) where.dropoutRisk = dropoutRisk;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Determine if the ID is a UUID or a studentId
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Build query based on ID type
    const whereClause = isUUID ? { id } : { studentId: id };

    const student = await prisma.student.findUnique({
      where: whereClause,
      include: {
        counselorAssignments: {
          include: {
            counselor: true
          }
        },
        mentorAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentor: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Convert date string if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData
    });

    // Auto-trigger assignment if High Risk or Notes changed for High Risk student
    if (
      (updateData.dropoutRisk === 'HIGH' && existingStudent.dropoutRisk !== 'HIGH') ||
      (updateData.counselorNotes && updateData.counselorNotes !== existingStudent.counselorNotes)
    ) {
      try {
        console.log(`Triggering auto-assignment for high-risk student: ${student.name}`);
        const { autoAssignMentor } = await import('../services/interventionService.js');
        await autoAssignMentor(student.id);
      } catch (err) {
        console.error('Failed to auto-assign mentor:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await prisma.student.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
};

// Bulk upload students from CSV
export const bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const students = [];
    const errors = [];
    let lineNumber = 1;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;
        try {
          // Validate and parse row data
          // Ensure keys match your CSV headers exactly
          const student = {
            studentId: row.studentId?.trim() || row['Student ID']?.trim() || row['student_id']?.trim(),
            name: row.name?.trim() || row['Name']?.trim(),
            email: row.email?.trim() || row['Email']?.trim(),
            phone: row.phone?.trim() || null,
            // Handle various date formats if needed
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            gender: row.gender?.trim() || null,
            department: row.department?.trim(),
            semester: row.semester ? parseInt(row.semester) : 1,
            currentCGPA: parseFloat(row.currentCGPA) || 0.0,
            attendancePercent: parseFloat(row.attendancePercent) || 0.0,
            familyIncome: row.familyIncome ? parseFloat(row.familyIncome) : null,
            parentEducation: row.parentEducation?.trim() || null,
            distanceFromHome: row.distanceFromHome ? parseFloat(row.distanceFromHome) : null,
            libraryVisits: parseInt(row.libraryVisits) || 0,
            extracurricular: String(row.extracurricular).toLowerCase() === 'true',
            disciplinaryIssues: parseInt(row.disciplinaryIssues) || 0,
            dropoutRisk: row.dropoutRisk?.trim() || 'UNKNOWN',
            // Fee data (parsed separately for FeeRecord creation)
            _feeData: {
              totalFees: row.totalFees ? parseFloat(row.totalFees) : null,
              feesPaid: row.feesPaid ? parseFloat(row.feesPaid) : null,
              feesPending: row.feesPending ? parseFloat(row.feesPending) : null,
              paymentStatus: row.paymentStatus?.trim() || 'PENDING'
            }
          };

          // Debug log for first few rows
          if (lineNumber <= 3) {
            console.log(`[Row ${lineNumber}] Parsed:`, student);
          }

          // Basic validation
          if (!student.studentId || !student.name || !student.email || !student.department) {
            console.warn(`[Row ${lineNumber}] Missing required fields. Raw row:`, row);
            errors.push({
              line: lineNumber,
              message: 'Missing required fields: studentId, name, email, or department'
            });
          } else {
            students.push(student);
          }
        } catch (err) {
          console.error(`[Row ${lineNumber}] Parsing error:`, err.message);
          errors.push({
            line: lineNumber,
            message: err.message
          });
        }
      })
      .on('end', async () => {
        try {
          if (students.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid students found in CSV',
              errors
            });
          }

          console.log(`Attempting to insert ${students.length} students...`);

          // Extract fee data and clean student objects
          const feeDataMap = {};
          const cleanStudents = students.map(s => {
            const { _feeData, ...studentData } = s;
            if (_feeData && _feeData.totalFees) {
              feeDataMap[s.studentId] = _feeData;
            }
            return studentData;
          });

          // Use createMany with skipDuplicates
          const result = await prisma.student.createMany({
            data: cleanStudents,
            skipDuplicates: true
          });

          console.log(`Successfully uploaded ${result.count} students.`);

          // Create fee records for students with fee data
          const studentIds = Object.keys(feeDataMap);
          if (studentIds.length > 0) {
            console.log(`Creating fee records for ${studentIds.length} students...`);
            const uploadedStudentsForFees = await prisma.student.findMany({
              where: { studentId: { in: studentIds } },
              select: { id: true, studentId: true }
            });

            for (const student of uploadedStudentsForFees) {
              const feeData = feeDataMap[student.studentId];
              if (feeData) {
                await prisma.feeRecord.upsert({
                  where: { studentId: student.id },
                  update: {
                    totalFees: feeData.totalFees || 0,
                    feesPaid: feeData.feesPaid || 0,
                    feesPending: feeData.feesPending || 0,
                    paymentStatus: feeData.paymentStatus || 'PENDING'
                  },
                  create: {
                    studentId: student.id,
                    totalFees: feeData.totalFees || 0,
                    feesPaid: feeData.feesPaid || 0,
                    feesPending: feeData.feesPending || 0,
                    paymentStatus: feeData.paymentStatus || 'PENDING'
                  }
                });
              }
            }
            console.log(`Fee records created.`);
          }

          //  Recalculate risk for newly uploaded students
          console.log('Calculating dropout risk for uploaded students...');
          const uploadedStudents = await prisma.student.findMany({
            where: {
              studentId: { in: students.map(s => s.studentId) }
            },
            include: {
              attendanceRecords: true,
              assessments: true
            }
          });

          // Calculate risk for each student
          const { calculateRisk } = await import('../services/riskEngine.js');
          const { autoAssignMentor } = await import('../services/interventionService.js');

          for (const student of uploadedStudents) {
            const { riskLevel, riskScore, riskReason } = calculateRisk(
              student,
              student.attendanceRecords || [],
              student.assessments || []
            );

            await prisma.student.update({
              where: { id: student.id },
              data: {
                dropoutRisk: riskLevel,
                riskReason: riskReason
              }
            });

            // Auto-assign mentor if HIGH risk
            if (riskLevel === 'HIGH') {
              try {
                console.log(`Auto-assigning mentor for uploaded high-risk student: ${student.name}`);
                await autoAssignMentor(student.id);
              } catch (err) {
                console.error(`Failed to auto-assign mentor to ${student.name}:`, err);
              }
            }
          }
          console.log(`Risk calculation completed for ${uploadedStudents.length} students.`);

          res.status(201).json({
            success: true,
            message: `Successfully uploaded ${result.count} students`,
            uploaded: result.count,
            total: students.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (error) {
          console.error('Bulk upload database error:', error);
          res.status(500).json({
            success: false,
            message: 'Error uploading students to database',
            error: error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing stream error:', error);
        res.status(500).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CSV upload',
      error: error.message
    });
  }
};

// Get student statistics
export const getStudentStats = async (req, res) => {
  try {
    const [total, byDepartment, byRisk, avgCGPA, avgAttendance] = await Promise.all([
      prisma.student.count(),
      prisma.student.groupBy({
        by: ['department'],
        _count: true
      }),
      prisma.student.groupBy({
        by: ['dropoutRisk'],
        _count: true
      }),
      prisma.student.aggregate({
        _avg: { currentCGPA: true }
      }),
      prisma.student.aggregate({
        _avg: { attendancePercent: true }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents: total,
        averageCGPA: avgCGPA._avg.currentCGPA?.toFixed(2) || 0,
        averageAttendance: avgAttendance._avg.attendancePercent?.toFixed(2) || 0,
        byDepartment,
        byDropoutRisk: byRisk
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
// force reload
