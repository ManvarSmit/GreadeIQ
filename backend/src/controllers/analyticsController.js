import {
  getDepartmentRiskAnalytics,
  getSubjectFailureHeatmap,
  getSemesterTransitionData,
  getAdminInsights
} from '../services/analyticsService.js';
import { exportStudentsToCSV } from '../services/csvService.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Get department-wise risk analytics
 */
export const getDepartmentRisk = async (req, res) => {
  try {
    const { semester } = req.query;
    const data = await getDepartmentRiskAnalytics(semester);
    res.json(successResponse(data, 'Department risk analytics retrieved'));
  } catch (error) {
    logger.error(`Get department risk error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to get department risk analytics', 500));
  }
};

/**
 * Get subject-wise failure heatmap
 */
export const getSubjectFailures = async (req, res) => {
  try {
    const data = await getSubjectFailureHeatmap();
    res.json(successResponse(data, 'Subject failure heatmap retrieved'));
  } catch (error) {
    logger.error(`Get subject failures error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to get subject failures', 500));
  }
};

/**
 * Get semester transition analysis
 */
export const getSemesterTransition = async (req, res) => {
  try {
    const data = await getSemesterTransitionData();
    res.json(successResponse(data, 'Semester transition data retrieved'));
  } catch (error) {
    logger.error(`Get semester transition error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to get semester transition data', 500));
  }
};

/**
 * Get admin dashboard insights
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const { semester } = req.query;
    const data = await getAdminInsights(semester);
    res.json(successResponse(data, 'Admin insights retrieved'));
  } catch (error) {
    logger.error(`Get admin insights error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to get admin insights', 500));
  }
};

/**
 * Export analytics report as CSV
 */
export const exportCSV = async (req, res) => {
  try {
    const { type, filters } = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `${type}_report_${timestamp}.csv`;
    const filepath = path.join(process.cwd(), 'exports', filename);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
      fs.mkdirSync(path.join(process.cwd(), 'exports'));
    }

    let result;
    if (type === 'students') {
      result = await exportStudentsToCSV(filepath, filters || {});
    } else {
      return res.status(400).json(errorResponse('Invalid export type', 400));
    }

    logger.info(`CSV export created: ${filename}`);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error(`CSV download error: ${err.message}`);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 60000); // Delete after 1 minute
    });
  } catch (error) {
    logger.error(`Export CSV error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to export CSV', 500));
  }
};

/**
 * Export analytics report as PDF
 */
export const exportPDF = async (req, res) => {
  try {
    const { type } = req.body;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `${type}_report_${timestamp}.pdf`;
    const filepath = path.join(process.cwd(), 'exports', filename);

    // Ensure exports directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
      fs.mkdirSync(path.join(process.cwd(), 'exports'));
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add content based on type
    if (type === 'admin-insights') {
      const insights = await getAdminInsights();
      
      // Title
      doc.fontSize(24).text('Student Dropout Prevention System', { align: 'center' });
      doc.fontSize(18).text('Admin Insights Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Overview
      doc.fontSize(16).text('Overview', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Students: ${insights.overview.totalStudents}`);
      doc.text(`Total Departments: ${insights.overview.totalDepartments}`);
      doc.text(`High Risk Students: ${insights.overview.highRiskStudents}`);
      doc.text(`Medium Risk Students: ${insights.overview.mediumRiskStudents}`);
      doc.text(`Low Risk Students: ${insights.overview.lowRiskStudents}`);
      doc.text(`Average CGPA: ${insights.overview.avgCGPA}`);
      doc.text(`Average Attendance: ${insights.overview.avgAttendance}%`);
      doc.moveDown(2);

      // Department Risk
      doc.fontSize(16).text('Top Departments by Risk', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      insights.departmentRisk.forEach((dept, index) => {
        doc.text(`${index + 1}. ${dept.department}`);
        doc.text(`   High Risk: ${dept.high} (${dept.highPercent}%)`, { indent: 20 });
        doc.text(`   Medium Risk: ${dept.medium} (${dept.mediumPercent}%)`, { indent: 20 });
        doc.text(`   Low Risk: ${dept.low} (${dept.lowPercent}%)`, { indent: 20 });
        doc.moveDown();
      });

    } else if (type === 'department-risk') {
      const data = await getDepartmentRiskAnalytics();
      
      doc.fontSize(24).text('Department Risk Analytics', { align: 'center' });
      doc.moveDown(2);
      
      data.forEach((dept, index) => {
        doc.fontSize(14).text(`${index + 1}. ${dept.department}`, { underline: true });
        doc.fontSize(12);
        doc.text(`Total Students: ${dept.total}`);
        doc.text(`High Risk: ${dept.high} (${dept.highPercent}%)`);
        doc.text(`Medium Risk: ${dept.medium} (${dept.mediumPercent}%)`);
        doc.text(`Low Risk: ${dept.low} (${dept.lowPercent}%)`);
        doc.text(`Average Risk Score: ${dept.avgRiskScore}`);
        doc.moveDown();
      });
    }

    // Finalize PDF
    doc.end();

    stream.on('finish', () => {
      logger.info(`PDF export created: ${filename}`);
      
      // Send file
      res.download(filepath, filename, (err) => {
        if (err) {
          logger.error(`PDF download error: ${err.message}`);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 60000); // Delete after 1 minute
      });
    });

  } catch (error) {
    logger.error(`Export PDF error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to export PDF', 500));
  }
};
