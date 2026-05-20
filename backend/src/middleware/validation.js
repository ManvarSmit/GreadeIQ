import { body, param, query, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Student validation rules
export const validateCreateStudent = [
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Student ID must be between 3 and 50 characters'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),

  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),

  body('currentCGPA')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),

  body('attendancePercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Attendance must be between 0 and 100'),

  handleValidationErrors
];

export const validateUpdateStudent = [
  param('id')
    .isUUID()
    .withMessage('Invalid student ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),

  body('currentCGPA')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('CGPA must be between 0 and 10'),

  body('attendancePercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Attendance must be between 0 and 100'),

  handleValidationErrors
];

export const validateStudentId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .custom((value) => {
      // Accept either UUID format or alphanumeric studentId (like CS2023001)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      const isStudentId = /^[A-Z0-9]{3,50}$/i.test(value);

      if (!isUUID && !isStudentId) {
        throw new Error('Invalid student ID format. Must be either a UUID or alphanumeric student ID');
      }
      return true;
    }),

  handleValidationErrors
];

export const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),

  query('department')
    .optional()
    .trim(),

  query('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),

  handleValidationErrors
];
