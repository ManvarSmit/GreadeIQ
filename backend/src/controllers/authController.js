import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import authConfig from '../config/auth.js';
import logger from '../utils/logger.js';
import { errorResponse, successResponse, isValidEmail } from '../utils/helpers.js';
import { sendCredentials } from '../services/emailService.js';

/**
 * Admin-only: Create a new user
 * POST /api/auth/admin/create-user
 */
export const createUser = async (req, res) => {
  try {
    const { email, name, role, specialization } = req.body;

    // Check if requester is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json(errorResponse('Only admins can create users', 403));
    }

    // Validation
    if (!email || !name) {
      return res.status(400).json(errorResponse('Email and name are required', 400));
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format', 400));
    }

    // Validate role
    const validRoles = ['ADMIN', 'MENTOR', 'COUNSELOR'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json(errorResponse('Invalid role', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email already exists', 409));
    }

    // Generate random secure password (8 characters)
    const tempPassword = crypto.randomBytes(6).toString('hex').slice(0, 8);

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, authConfig.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'MENTOR',
        isTemporaryPassword: true, // Flag for forced reset
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Auto-create Counselor or Mentor profile based on role
    if (user.role === 'COUNSELOR') {
      await prisma.counselor.create({
        data: {
          name: user.name,
          email: user.email,
          department: null,
          maxStudents: 30 // Default capacity
        }
      });
      logger.info(`Created Counselor profile for: ${user.email}`);
    } else if (user.role === 'MENTOR') {
      await prisma.mentor.create({
        data: {
          name: user.name,
          email: user.email,
          department: null,
          specialization: specialization || null
        }
      });
      logger.info(`Created Mentor profile for: ${user.email}`);
    }

    // Send credentials via email
    // We don't await this to block response, but valid for small scale
    sendCredentials(email, name, tempPassword, user.role);

    logger.info(`Admin ${req.user.email} created new user: ${user.email}`);

    res.status(201).json(successResponse(
      user,
      'User created successfully. Credentials sent via email.'
    ));
  } catch (error) {
    logger.error(`Create user error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to create user', 500));
  }
};

/**
 * Register a new user (public - for initial setup only)
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json(errorResponse('Email, password, and name are required', 400));
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format', 400));
    }

    if (password.length < 6) {
      return res.status(400).json(errorResponse('Password must be at least 6 characters', 400));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json(errorResponse('User with this email already exists', 409));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'MENTOR',
        isTemporaryPassword: false, // Self-registered usually sets own password
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json(successResponse(
      { user, token },
      'User registered successfully'
    ));
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json(errorResponse('Registration failed', 500));
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required', 400));
    }

    // Find user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    let isStudent = false;

    if (!user) {
      user = await prisma.student.findUnique({
        where: { email }
      });
      if (user) {
        isStudent = true;
        user.role = 'STUDENT';
      }
    }

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials', 401));
    }

    if (!isStudent && user.isActive === false) {
      return res.status(403).json(errorResponse('Account is deactivated', 403));
    }

    // Verify password
    let isPasswordValid = false;
    if (isStudent) {
      if (user.password) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Fallback to studentId (e.g. 23DCS001 matches password)
        isPasswordValid = (password.toLowerCase() === user.studentId.toLowerCase());
      }
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid credentials', 401));
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Fetch associated profile data
    let profileData = {};
    if (user.role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({ where: { email: user.email } });
      if (mentor) profileData = { ...mentor, profileId: mentor.id };
    } else if (user.role === 'COUNSELOR') {
      const counselor = await prisma.counselor.findUnique({ where: { email: user.email } });
      if (counselor) profileData = { ...counselor, profileId: counselor.id };
    }

    const responseUser = {
      ...userWithoutPassword,
      ...profileData, // Merge profile data (specialization, department, etc)
      id: user.id // Ensure User ID is preserved as top-level 'id'
    };

    logger.info(`User/Student logged in: ${user.email}`);

    res.json(successResponse(
      {
        user: responseUser,
        token,
        mustChangePassword: !isStudent && user.isTemporaryPassword
      },
      'Login successful'
    ));
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json(errorResponse('Login failed', 500));
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let user;
    
    if (role === 'STUDENT') {
      user = await prisma.student.findUnique({
        where: { id: userId },
      });
      if (user) {
        user.role = 'STUDENT';
        delete user.password; // do not return password
      }
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isTemporaryPassword: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }

    // Fetch associated profile data
    let profileData = {};
    if (user.role === 'MENTOR') {
      const mentor = await prisma.mentor.findUnique({ where: { email: user.email } });
      if (mentor) profileData = { ...mentor, profileId: mentor.id };
    } else if (user.role === 'COUNSELOR') {
      const counselor = await prisma.counselor.findUnique({ where: { email: user.email } });
      if (counselor) profileData = { ...counselor, profileId: counselor.id };
    }

    const responseUser = {
      ...user,
      ...profileData, // Merge profile data
      id: user.id // Ensure User ID is preserved
    };

    res.json(successResponse(responseUser, 'User profile retrieved'));
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to get user profile', 500));
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(errorResponse('Token is required', 400));
    }

    // Verify old token (even if expired)
    const decoded = jwt.verify(token, authConfig.jwt.secret, { ignoreExpiration: true });

    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );

    res.json(successResponse({ token: newToken }, 'Token refreshed'));
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(401).json(errorResponse('Invalid token', 401));
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(errorResponse('Current and new password are required', 400));
    }

    if (newPassword.length < 6) {
      return res.status(400).json(errorResponse('New password must be at least 6 characters', 400));
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Current password is incorrect', 401));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcrypt.saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isTemporaryPassword: false // Unlock account
      }
    });

    logger.info(`Password changed for user: ${user.email}`);

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json(errorResponse('Failed to change password', 500));
  }
};
