import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Analytics from './pages/Analytics';
import AdminDashboard from './pages/AdminDashboard';
import DataManagement from './pages/DataManagement';
import Reports from './pages/Reports';
import MentorDashboard from './pages/MentorDashboard';
import MentorAnalytics from './pages/MentorAnalytics';
import AcademicDataManagement from './pages/AcademicDataManagement';
import AcademicQuizzes from './pages/AcademicQuizzes';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentQuizzes from './pages/student/StudentQuizzes';
import QuizAttemptUI from './pages/student/QuizAttemptUI';
import QuizResultUI from './pages/student/QuizResultUI';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import './index.css';

function App() {
  const location = useLocation();

  return (
    <ToastProvider>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public route - No Layout */}
            <Route path="/login" element={
              <PageTransition>
                <Login />
              </PageTransition>
            } />

            <Route path="/change-password" element={
              <PageTransition>
                <ChangePassword />
              </PageTransition>
            } />

            {/* Isolated Protected Routes (No Layout) */}
            <Route path="/student/quiz/:id" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <PageTransition>
                  <QuizAttemptUI />
                </PageTransition>
              </ProtectedRoute>
            } />
            <Route path="/student/quiz/:id/result/:attemptId" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <PageTransition>
                  <QuizResultUI />
                </PageTransition>
              </ProtectedRoute>
            } />

            {/* Protected routes wrapped in Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              } />
              <Route path="/students" element={
                <PageTransition>
                  <Students />
                </PageTransition>
              } />
              <Route path="/students/:id" element={
                <PageTransition>
                  <StudentProfile />
                </PageTransition>
              } />
              <Route path="/analytics" element={
                <PageTransition>
                  <Analytics />
                </PageTransition>
              } />
              <Route path="/data-management" element={
                <PageTransition>
                  <DataManagement />
                </PageTransition>
              } />
              <Route path="/reports" element={
                <PageTransition>
                  <Reports />
                </PageTransition>
              } />
              
              {/* Mentor Routes */}
              <Route path="/mentor/my-students" element={
                <PageTransition>
                  <MentorDashboard />
                </PageTransition>
              } />
              <Route path="/mentor/analytics" element={
                <PageTransition>
                  <MentorAnalytics />
                </PageTransition>
              } />
              <Route path="/academic/data" element={
                <PageTransition>
                  <AcademicDataManagement />
                </PageTransition>
              } />
              <Route path="/academic/quizzes" element={
                <PageTransition>
                  <AcademicQuizzes />
                </PageTransition>
              } />

              {/* Seamless redirects for legacy counseling URLs */}
              <Route path="/counseling/queue" element={<Navigate to="/mentor/my-students" replace />} />
              <Route path="/counseling/analytics" element={<Navigate to="/mentor/analytics" replace />} />
              <Route path="/counseling/data" element={<Navigate to="/academic/data" replace />} />
              <Route path="/counseling/quizzes" element={<Navigate to="/academic/quizzes" replace />} />

              {/* Student Routes */}
              <Route path="/student/dashboard" element={
                <PageTransition>
                  <StudentDashboard />
                </PageTransition>
              } />
              <Route path="/student/quizzes" element={
                <PageTransition>
                  <StudentQuizzes />
                </PageTransition>
              } />

              {/* Admin dashboard - restricted */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PageTransition>
                    <AdminDashboard />
                  </PageTransition>
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
