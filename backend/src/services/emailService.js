import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create a transporter
// For development, we'll try to use a local SMTP or fallback to Ethereal
// In production, use real credentials from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test_user',
    pass: process.env.SMTP_PASS || 'test_pass',
  },
});

export const sendCredentials = async (email, name, password, role) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Student Success System" <admin@success-system.edu>',
      to: email,
      subject: 'Welcome to Student Success System - Your Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4F46E5;">Welcome to the Team!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>An account has been created for you as a <strong>${role}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
          </div>
          <p>Please log in immediately. You will be required to change this password on your first login.</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
          <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    logger.info(`Credentials sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${email}: ${error.message}`);
    console.error('SMTP Error Details:', error);
    // In dev, if it fails, fallback to console so developer isn't stuck
    if (process.env.NODE_ENV !== 'production') {
      console.log('==========================================');
      console.log(`[FALLBACK] Email delivery failed. Credentials for: ${email}`);
      console.log(`Password: ${password}`);
      console.log('==========================================');
    }
    return false;
  }
};
