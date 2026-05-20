/**
 * Authentication configuration
 */

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  bcrypt: {
    saltRounds: 10,
  },
  roles: {
    ADMIN: 'ADMIN',
    FACULTY: 'FACULTY',
    MENTOR: 'MENTOR',
  },
};

export default authConfig;
