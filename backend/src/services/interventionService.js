import prisma from '../config/database.js';

/**
 * SLA durations in milliseconds
 */
const SLA_DURATIONS = {
  HIGH: 48 * 60 * 60 * 1000,    // 48 hours
  MEDIUM: 7 * 24 * 60 * 60 * 1000,  // 7 days
  LOW: 14 * 24 * 60 * 60 * 1000     // 14 days
};

import { analyzeStudentProblems, suggestMentors } from './geminiService.js';

/**
 * Auto-assign student to available mentor (AI-Powered)
 * @param {string} studentId - Student ID
 * @returns {Promise<Object|null>} Assignment or null if no mentor available
 */
export const autoAssignMentor = async (studentId) => {
  try {
    // 1. Get student data with counselor notes
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        counselorNotes: true,
        problemCategories: true,
        counselor: true, // Need to check if counselor exists
        mentorAssignment: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!student) return null;

    // Check pre-requisites based on user rules
    if (!student.counselor) {
      console.warn(`Student ${student.name} has no counselor, skipping auto-assign`);
      return null;
    }

    if (student.mentorAssignment && student.mentorAssignment.length > 0) {
      console.warn(`Student ${student.name} already has a mentor`);
      return null;
    }

    // 2. Get all mentors with availability
    const mentors = await prisma.mentor.findMany({
      include: {
        assignedStudents: {
          where: { status: 'ACTIVE' },
          select: { id: true } // Only need ID to count
        }
      }
    });

    // Filter mentors with capacity
    const availableMentors = mentors.filter(m => m.assignedStudents.length < m.maxStudents);

    if (availableMentors.length === 0) {
      console.warn('No mentors available for assignment');
      return null;
    }

    let selectedMentor = null;

    // 3. AI Matching Logic
    if (student.counselorNotes && student.counselorNotes.trim().length > 0) {
      try {
        console.log(`Analyzing student ${student.name} for AI mentor matching...`);

        // Analyze problems (or use existing analysis if recent/valid)
        let categories = [];
        if (student.problemCategories) {
          categories = JSON.parse(student.problemCategories);
        } else {
          const analysis = await analyzeStudentProblems(student.counselorNotes);
          categories = analysis.categories;

          // Save analysis to student
          await prisma.student.update({
            where: { id: studentId },
            data: {
              problemCategories: JSON.stringify(analysis.categories),
              aiAnalysis: analysis.summary,
              aiAnalyzedAt: new Date()
            }
          });
        }

        // Get suggestions
        const suggestions = await suggestMentors({
          problemCategories: categories,
          counselorNotes: student.counselorNotes,
          department: 'Unknown', // Could fetch if needed
          dropoutRisk: 'Unknown'
        }, availableMentors);

        if (suggestions.length > 0 && suggestions[0].matchScore > 0) {
          selectedMentor = suggestions[0];
          console.log(`AI selected mentor ${selectedMentor.name} (Score: ${selectedMentor.matchScore})`);
        }
      } catch (err) {
        console.error('AI matching failed, falling back to load balancing:', err);
      }
    }

    // 4. Fallback: Load Balancing (Least Assigned)
    if (!selectedMentor) {
      selectedMentor = availableMentors.sort((a, b) => a.assignedStudents.length - b.assignedStudents.length)[0];
      console.log(`Fallback selected mentor ${selectedMentor.name} (Load: ${selectedMentor.assignedStudents.length})`);
    }

    // 5. Assign
    if (selectedMentor) {
      return assignMentor(studentId, selectedMentor.id);
    }

    return null;

  } catch (error) {
    console.error('Error auto-assigning mentor:', error);
    return null;
  }
};

/**
 * Assign student to mentor
 * @param {string} studentId - Student ID
 * @param {string} mentorId - Mentor ID
 * @returns {Promise<Object>} Assignment record
 */
export const assignMentor = async (studentId, mentorId) => {
  try {
    // Check if student already has active assignment
    const existing = await prisma.mentorAssignment.findFirst({
      where: {
        studentId,
        status: 'ACTIVE'
      }
    });

    if (existing) {
      // Reassign
      await prisma.mentorAssignment.update({
        where: { id: existing.id },
        data: { status: 'REASSIGNED' }
      });
    }

    const assignment = await prisma.mentorAssignment.create({
      data: {
        studentId,
        mentorId,
        status: 'ACTIVE'
      },
      include: {
        student: true,
        mentor: true
      }
    });

    console.log(`Student ${studentId} assigned to mentor ${mentorId}`);
    return assignment;
  } catch (error) {
    console.error('Error assigning mentor:', error);
    throw error;
  }
};

/**
 * Create intervention task with SLA
 * @param {string} studentId - Student ID
 * @param {string} priority - Priority level (HIGH, MEDIUM, LOW)
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string} mentorId - Optional mentor ID
 * @returns {Promise<Object>} Created task
 */
export const createInterventionTask = async (studentId, priority, title, description, mentorId = null) => {
  try {
    // Calculate due date based on SLA
    const dueDate = new Date(Date.now() + SLA_DURATIONS[priority]);

    const task = await prisma.interventionTask.create({
      data: {
        studentId,
        mentorId,
        title,
        description,
        priority,
        dueDate
      },
      include: {
        student: true
      }
    });

    console.log(`Intervention task created for student ${studentId} with ${priority} priority (due: ${dueDate})`);
    return task;
  } catch (error) {
    console.error('Error creating intervention task:', error);
    throw error;
  }
};

/**
 * Check for SLA violations and return overdue tasks
 * @returns {Promise<Array>} List of overdue tasks
 */
export const checkSLAViolations = async () => {
  try {
    const now = new Date();

    const overdueTasks = await prisma.interventionTask.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        },
        dueDate: {
          lt: now
        },
        escalated: false
      },
      include: {
        student: true
      }
    });

    console.log(`Found ${overdueTasks.length} overdue tasks`);
    return overdueTasks;
  } catch (error) {
    console.error('Error checking SLA violations:', error);
    throw error;
  }
};

/**
 * Escalate overdue task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>} Updated task
 */
export const escalateTask = async (taskId) => {
  try {
    const task = await prisma.interventionTask.update({
      where: { id: taskId },
      data: {
        status: 'ESCALATED',
        escalated: true,
        escalatedAt: new Date()
      },
      include: {
        student: true
      }
    });

    console.log(`Task ${taskId} escalated for student ${task.student.name}`);

    // Create alert for escalation
    const alertService = await import('./alertService.js');
    await alertService.createAlert(
      task.studentId,
      'HIGH',
      `ESCALATED: Intervention task "${task.title}" overdue and requires immediate attention`
    );

    return task;
  } catch (error) {
    console.error('Error escalating task:', error);
    throw error;
  }
};

/**
 * Auto-escalate all overdue tasks
 * @returns {Promise<Array>} List of escalated tasks
 */
export const autoEscalateOverdueTasks = async () => {
  try {
    const overdueTasks = await checkSLAViolations();

    const escalated = [];
    for (const task of overdueTasks) {
      const escalatedTask = await escalateTask(task.id);
      escalated.push(escalatedTask);
    }

    console.log(`Auto-escalated ${escalated.length} tasks`);
    return escalated;
  } catch (error) {
    console.error('Error auto-escalating tasks:', error);
    throw error;
  }
};

/**
 * Update task status
 * @param {string} taskId - Task ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated task
 */
export const updateTaskStatus = async (taskId, status) => {
  try {
    const data = { status };

    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    return await prisma.interventionTask.update({
      where: { id: taskId },
      data
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};
