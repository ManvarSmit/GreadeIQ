import prisma from '../config/database.js';

/**
 * Get assigned students for the logged-in mentor
 * GET /api/mentor/my-students
 */
export const getMyStudents = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Find the Mentor record linked to this user's email
    // The User and Mentor tables are separate but share email
    let mentor = await prisma.mentor.findUnique({
      where: { email: userEmail }
    });

    if (!mentor) {
      // If no mentor profile exists yet, but they have the role, 
      // we could optionally create one or just return empty
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No mentor profile found for this user'
      });
    }

    // Get assigned students with their risk profile
    const assignments = await prisma.mentorAssignment.findMany({
      where: {
        mentorId: mentor.id,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            department: true,
            semester: true,
            currentCGPA: true,
            attendancePercent: true,
            dropoutRisk: true,
            riskReason: true
          }
        }
      }
    });

    const students = assignments.map(a => a.student);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get my students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned students',
      error: error.message
    });
  }
};

/**
 * Get counselors assigned to the logged-in mentor
 * GET /api/mentor/my-counselors
 */
export const getMyCounselors = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Find the Mentor record
    const mentor = await prisma.mentor.findUnique({
      where: { email: userEmail }
    });

    if (!mentor) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No mentor profile found for this user'
      });
    }

    // Get assigned counselors with their student stats
    const assignments = await prisma.mentorCounselorAssignment.findMany({
      where: {
        mentorId: mentor.id,
        status: 'ACTIVE'
      },
      include: {
        counselor: {
          include: {
            assignedStudents: {
              where: { status: 'ACTIVE' },
              include: {
                student: {
                  select: {
                    dropoutRisk: true,
                    currentCGPA: true,
                    attendancePercent: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const counselorsWithStats = assignments.map(assignment => {
      const counselor = assignment.counselor;
      const students = counselor.assignedStudents.map(a => a.student);
      const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
      const avgCGPA = students.length > 0
        ? (students.reduce((acc, s) => acc + s.currentCGPA, 0) / students.length).toFixed(2)
        : 0;
      const avgAttendance = students.length > 0
        ? (students.reduce((acc, s) => acc + s.attendancePercent, 0) / students.length).toFixed(1)
        : 0;

      return {
        id: counselor.id,
        name: counselor.name,
        email: counselor.email,
        department: counselor.department,
        studentCount: students.length,
        highRiskCount: highRisk,
        avgCGPA: parseFloat(avgCGPA),
        avgAttendance: parseFloat(avgAttendance),
        maxStudents: counselor.maxStudents,
        assignedAt: assignment.assignedAt
      };
    });

    res.status(200).json({
      success: true,
      count: counselorsWithStats.length,
      data: counselorsWithStats
    });

  } catch (error) {
    console.error('Get my counselors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned counselors',
      error: error.message
    });
  }
};

/**
 * Get students under a specific counselor (mentor access)
 * GET /api/mentor/counselor/:id/students
 */
export const getStudentsByCounselor = async (req, res) => {
  try {
    const { id: counselorId } = req.params;
    const userEmail = req.user.email;

    // Verify mentor has access to this counselor
    const mentor = await prisma.mentor.findUnique({
      where: { email: userEmail }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const assignment = await prisma.mentorCounselorAssignment.findFirst({
      where: {
        mentorId: mentor.id,
        counselorId,
        status: 'ACTIVE'
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this counselor'
      });
    }

    // Get students under this counselor
    const studentAssignments = await prisma.counselorAssignment.findMany({
      where: {
        counselorId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            department: true,
            semester: true,
            currentCGPA: true,
            attendancePercent: true,
            dropoutRisk: true,
            riskReason: true
          }
        }
      },
      orderBy: {
        student: {
          dropoutRisk: 'asc'
        }
      }
    });

    const students = studentAssignments.map(a => a.student);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Get students by counselor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counselor students',
      error: error.message
    });
  }
};

/**
 * Get aggregated counselor statistics for mentor
 * GET /api/mentor/counselor-stats
 */
export const getMyCounselorStats = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const mentor = await prisma.mentor.findUnique({
      where: { email: userEmail },
      include: {
        counselorAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            counselor: {
              include: {
                assignedStudents: {
                  where: { status: 'ACTIVE' },
                  include: {
                    student: {
                      select: {
                        dropoutRisk: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profile not found'
      });
    }

    const totalCounselors = mentor.counselorAssignments.length;
    let totalStudents = 0;
    let totalHighRisk = 0;

    mentor.counselorAssignments.forEach(assignment => {
      const students = assignment.counselor.assignedStudents.map(a => a.student);
      totalStudents += students.length;
      totalHighRisk += students.filter(s => s.dropoutRisk === 'HIGH').length;
    });

    res.status(200).json({
      success: true,
      data: {
        totalCounselors,
        totalStudents,
        totalHighRisk,
        avgStudentsPerCounselor: totalCounselors > 0
          ? (totalStudents / totalCounselors).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    console.error('Get counselor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counselor statistics',
      error: error.message
    });
  }
};

/**
 * Add/update student marks (Mentor / Admin)
 * POST /api/mentor/student/:id/marks
 */
export const updateStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const { subject, examType, marksObtained, totalMarks, date } = req.body;

    if (req.user.role !== 'ADMIN') {
      const mentor = await prisma.mentor.findUnique({
        where: { email: userEmail }
      });

      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor profile not found'
        });
      }

      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          studentId: id,
          mentorId: mentor.id,
          status: 'ACTIVE'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You do not have active mentorship access to this student'
        });
      }
    }

    if (parseFloat(marksObtained) > parseFloat(totalMarks)) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained cannot exceed total marks'
      });
    }

    const assessment = await prisma.assessment.create({
      data: {
        studentId: id,
        subject,
        examType,
        marksObtained: parseFloat(marksObtained),
        totalMarks: parseFloat(totalMarks),
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Marks added successfully'
    });

  } catch (error) {
    console.error('Update student marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student marks',
      error: error.message
    });
  }
};

/**
 * Update student attendance (Mentor / Admin)
 * POST /api/mentor/student/:id/attendance
 */
export const updateStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const { date, status, subject } = req.body;

    if (req.user.role !== 'ADMIN') {
      const mentor = await prisma.mentor.findUnique({
        where: { email: userEmail }
      });

      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor profile not found'
        });
      }

      const assignment = await prisma.mentorAssignment.findFirst({
        where: {
          studentId: id,
          mentorId: mentor.id,
          status: 'ACTIVE'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You do not have active mentorship access to this student'
        });
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId: id,
        date: date ? new Date(date) : new Date(),
        status: status || 'PRESENT',
        subject: subject || null
      }
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance recorded successfully'
    });

  } catch (error) {
    console.error('Update student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: error.message
    });
  }
};
