import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js'; // Added
import feeRoutes from './routes/feeRoutes.js'; // Added
import riskRoutes from './routes/riskRoutes.js';
import interventionRoutes from './routes/interventionRoutes.js';
import counselingRoutes from './routes/counselingRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import counselorRoutes from './routes/counselorRoutes.js'; // Added
import adminRoutes from './routes/adminRoutes.js'; // Added
import reportingRoutes from './routes/reportingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // AI-powered features
import quizRoutes from './routes/quizRoutes.js'; // Added Quiz System
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
/** Vite / browsers may use localhost or 127.0.0.1; mismatch breaks all API calls after login. */
const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (isDev && isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin === allowed) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/attendance', attendanceRoutes); // Added
app.use('/api/fees', feeRoutes); // Added
app.use('/api/risk', riskRoutes);
app.use('/api/intervention', interventionRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/counselor', counselorRoutes); // Added
app.use('/api/admin', adminRoutes); // Added
app.use('/api/reports', reportingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes); // AI-powered features
app.use('/api/quizzes', quizRoutes); // Quiz System
// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Dropout Prevention System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
