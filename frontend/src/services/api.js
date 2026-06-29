import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('--- GREADEIQ API CONFIGURATION ---');
console.log('Active API URL:', API_BASE_URL);
console.log('Raw Env Value:', import.meta.env.VITE_API_URL);


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for AI operations
});

// Request interceptor - Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return the data directly
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          sessionStorage.removeItem('authToken');
          console.error('Unauthorized. Redirecting to login.');
          // Auto-logout: Redirect to login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Access denied.');
          break;
        case 404:
          console.error('Resource not found.');
          break;
        case 500:
          console.error('Server error. Please try again later.');
          break;
        default:
          console.error(`Error: ${data.message || 'An error occurred'}`);
      }

      return Promise.reject(data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error. Please check your connection.');
      return Promise.reject({ message: 'Network error. Backend might be down.' });
    } else {
      // Something else happened
      console.error('Request failed:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  createUser: (data) => api.post('/auth/admin/create-user', data), // Admin only
};

// ==================== STUDENT ENDPOINTS ====================
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  uploadCSV: (formData) => api.post('/students/upload/csv', formData, {
    headers: { 'Content-Type': undefined }
  }),
  delete: (id) => api.delete(`/students/${id}`),
  clearAllData: () => api.delete('/students/clear-all'),
  getStats: () => api.get('/students/stats'),
};

// ==================== RISK ENDPOINTS ====================
export const riskAPI = {
  getProfile: (id) => api.get(`/risk/profile/${id}`),
  getAllProfiles: (params) => api.get('/risk/profiles', { params }),
  calculate: (id) => api.post(`/risk/calculate/${id}`),
};

// ==================== ACADEMIC ENDPOINTS ====================
export const academicAPI = {
  recordAttendance: (data) => api.post('/academic/attendance', data),
  recordMarks: (data) => api.post('/academic/marks', data),
  getStudentAcademics: (id) => api.get(`/academic/student/${id}`),
  uploadAssessmentsCSV: (formData) => api.post('/academic/assessments/upload/csv', formData, {
    headers: { 'Content-Type': undefined }
  }),
  uploadAttemptsCSV: (formData) => api.post('/academic/attempts/upload/csv', formData, {
    headers: { 'Content-Type': undefined }
  }),
};

// ==================== ATTENDANCE ENDPOINTS ====================
export const attendanceAPI = {
  uploadCSV: (formData) => api.post('/attendance/upload/csv', formData, {
    headers: { 'Content-Type': undefined }
  }),
};

// ==================== FEE ENDPOINTS ====================
export const feeAPI = {
  getAll: (params) => api.get('/fees', { params }),
  getByStudentId: (studentId) => api.get(`/fees/student/${studentId}`),
  uploadCSV: (formData) => api.post('/fees/upload/csv', formData, {
    headers: { 'Content-Type': undefined }
  }),
};

// ==================== INTERVENTION ENDPOINTS ====================
export const interventionAPI = {
  assignMentor: (data) => api.post('/intervention/assign-mentor', data),
  createTask: (data) => api.post('/intervention/task', data),
  getTasks: (params) => api.get('/intervention/tasks', { params }),
  getAlerts: (params) => api.get('/intervention/alerts', { params }),
};

// ==================== MENTOR ENDPOINTS ====================
export const mentorAPI = {
  getMyStudents: () => api.get('/mentor/my-students'),
  getMyCounselors: () => api.get('/mentor/my-counselors'),
  getStudentsByCounselor: (counselorId) => api.get(`/mentor/counselor/${counselorId}/students`),
  getCounselorStats: () => api.get('/mentor/counselor-stats'),
};

// ==================== COUNSELOR ENDPOINTS ====================
export const counselorAPI = {
  getMyStudents: () => api.get('/counselor/my-students'),
  updateStudentDetails: (id, data) => api.put(`/counselor/student/${id}/details`, data),
  updateStudentMarks: (id, data) => api.post(`/counselor/student/${id}/marks`, data),
  updateStudentAttendance: (id, data) => api.post(`/counselor/student/${id}/attendance`, data),
  getMyStats: () => api.get('/counselor/stats'),
};

// ==================== ADMIN ENDPOINTS ====================
export const adminAPI = {
  getAllMentors: () => api.get('/admin/mentors'),
  getAllCounselors: () => api.get('/admin/counselors'),
  assignStudentToCounselor: (data) => api.post('/admin/assign/student-counselor', data),
  assignMentorToCounselor: (data) => api.post('/admin/assign/mentor-counselor', data),
  bulkAssignStudents: (data) => api.post('/admin/assign/bulk-students', data),
  reassignStudent: (data) => api.put('/admin/reassign/student', data),
  getUserManagementStats: () => api.get('/admin/stats'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
};

// ==================== COUNSELING ENDPOINTS ====================
export const counselingAPI = {
  getQueue: () => api.get('/counseling/queue'),
  createLog: (data) => api.post('/counseling/create', data),
  getHistory: (studentId) => api.get(`/counseling/student/${studentId}`),
  getMetrics: (studentId) => api.get(`/counseling/student/${studentId}/metrics`),
};

// ==================== REPORTS ENDPOINTS ====================
export const reportsAPI = {
  getRiskReduction: () => api.get('/reports/risk-reduction'),
  getStudentImpact: (studentId) => api.get(`/reports/student/${studentId}/impact`),
  getMentorImpact: (mentorId) => api.get(`/reports/mentor/${mentorId}/impact`),
};

// ==================== ANALYTICS ENDPOINTS ====================
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getDepartmentRisk: (params) => api.get('/analytics/department-risk', { params }),
  getSubjectFailures: () => api.get('/analytics/subject-failures'),
  getSemesterTransition: () => api.get('/analytics/semester-transition'),
  getAdminInsights: (params) => api.get('/analytics/admin-insights', { params }),
  exportCSV: (data) => api.post('/analytics/export-csv', data),
  exportPDF: (data) => api.post('/analytics/export-pdf', data),
};

// ==================== QUIZ ENDPOINTS ====================
export const quizAPI = {
  createQuiz: (data) => api.post('/quizzes/create', data),
  getQuizzes: (params) => api.get('/quizzes/my-quizzes', { params }),
  getAvailableQuizzes: () => api.get('/quizzes/available'),
  getPastAttempts: () => api.get('/quizzes/past-attempts'),
  getQuizById: (id) => api.get(`/quizzes/${id}`),
  startQuiz: (quizId) => api.post('/quizzes/start', { quizId }),
  submitQuiz: (attemptId, data) => api.post('/quizzes/submit', { attemptId, ...data }),
  logViolation: (attemptId, data) => api.post('/quizzes/violation', { attemptId, ...data }),
};

// ==================== AI ENDPOINTS ====================
export const aiAPI = {
  analyzeStudent: (studentId) => api.post(`/ai/analyze-student/${studentId}`),
  suggestMentors: (studentId) => api.post(`/ai/suggest-mentors/${studentId}`),
  getImprovementPlan: (studentId) => api.post(`/ai/improvement-plan/${studentId}`),
  autoAssignMentor: (studentId) => api.post(`/ai/auto-assign/${studentId}`),
  generateQuiz: (data) => api.post(`/ai/generate-quiz`, data),
};

// ==================== HEALTH CHECK ====================
export const healthCheck = () => api.get('/health');

// Export default api instance for custom requests
export default api;
