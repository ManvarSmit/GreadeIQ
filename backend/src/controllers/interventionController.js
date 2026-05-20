import prisma from '../config/database.js';
import {
  assignMentor,
  autoAssignMentor,
  createInterventionTask,
  updateTaskStatus,
  autoEscalateOverdueTasks
} from '../services/interventionService.js';
import { getUnreadAlerts, markAlertAsRead } from '../services/alertService.js';

/**
 * Assign mentor to student
 * POST /api/intervention/assign-mentor
 */
export const assignMentorToStudent = async (req, res) => {
  try {
    const { studentId, mentorId } = req.body;
    
    const assignment = await assignMentor(studentId, mentorId);
    
    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Assign mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning mentor',
      error: error.message
    });
  }
};

/**
 * Create intervention task
 * POST /api/intervention/create-task
 */
export const createTask = async (req, res) => {
  try {
    const { studentId, priority, title, description, mentorId } = req.body;
    
    const task = await createInterventionTask(studentId, priority, title, description, mentorId);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating intervention task',
      error: error.message
    });
  }
};

/**
 * Get all intervention tasks
 * GET /api/intervention/tasks?status=PENDING
 */
export const getTasks = async (req, res) => {
  try {
    const { status, priority, escalated } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (escalated !== undefined) where.escalated = escalated === 'true';
    
    const tasks = await prisma.interventionTask.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            department: true,
            dropoutRisk: true
          }
        }
      },
      orderBy: [
        { escalated: 'desc' },
        { priority: 'asc' },
        { dueDate: 'asc' }
      ]
    });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

/**
 * Update task status
 * PUT /api/intervention/tasks/:id
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await updateTaskStatus(id, status);
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

/**
 * Get all alerts
 * GET /api/intervention/alerts?unreadOnly=true
 */
export const getAlerts = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    let alerts;
    if (unreadOnly === 'true') {
      alerts = await getUnreadAlerts();
    } else {
      alerts = await prisma.alert.findMany({
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              name: true,
              department: true,
              dropoutRisk: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

/**
 * Mark alert as read
 * PUT /api/intervention/alerts/:id/read
 */
export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await markAlertAsRead(id);
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking alert as read',
      error: error.message
    });
  }
};

/**
 * Check SLA and auto-escalate overdue tasks
 * POST /api/intervention/check-sla
 */
export const checkSLA = async (req, res) => {
  try {
    const escalatedTasks = await autoEscalateOverdueTasks();
    
    res.status(200).json({
      success: true,
      message: `Checked SLA and escalated ${escalatedTasks.length} overdue tasks`,
      data: escalatedTasks
    });
  } catch (error) {
    console.error('Check SLA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking SLA',
      error: error.message
    });
  }
};
