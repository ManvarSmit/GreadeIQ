import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import {
  LogIn,
  GraduationCap,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFillCredentials = (email, password, roleName = 'Admin') => {
    setFormData({
      email,
      password,
    });
    success(`${roleName} credentials filled! Click "Sign In" below to log in.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        success('Welcome back!');

        // Enforce password change if flagged
        if (result.mustChangePassword) {
          navigate('/change-password');
          return;
        }

        // Redirect based on role
        switch (result.user.role) {
          case 'ADMIN':
            navigate('/');
            break;
          case 'MENTOR':
            navigate('/mentor/my-students');
            break;
          case 'STUDENT':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        const errorMsg = result.error || 'Login failed';
        if (
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('failed to fetch') ||
          errorMsg.toLowerCase().includes('connection refused')
        ) {
          toastError('Cannot connect to backend server. Ensure backend is running and VITE_API_URL is configured on Vercel.');
        } else {
          toastError(errorMsg);
        }
      }
    } catch (err) { // eslint-disable-line no-unused-vars
      toastError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg opacity-80"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 p-4"
      >
        <div className="bg-dark-surface/80 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-dark-border p-8">

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/30 mb-6 text-white"
            >
              <GraduationCap size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Student Success</h1>
            <p className="text-dark-muted">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-dark-muted group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-dark-muted"
                  placeholder="Email address"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-dark-muted group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-dark-muted"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-muted hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Card */}
            <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-300">
                    Live Demo / Visitor Access
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  ADMIN
                </span>
              </div>

              <p className="text-xs text-dark-muted leading-relaxed">
                Visiting without credentials? Click below to auto-fill the administrator credentials.
              </p>

              <button
                type="button"
                onClick={() => handleFillCredentials('admin@university.edu', 'admin123', 'Admin')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <KeyRound size={15} className="group-hover:rotate-12 transition-transform text-white/90" />
                  <span className="font-semibold">Login with Admin Credentials</span>
                </div>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-mono text-white flex items-center gap-1">
                  <Sparkles size={11} /> Auto-fill
                </span>
              </button>

              {/* Quick links for other roles */}
              <div className="pt-2 border-t border-primary-500/20 flex items-center justify-between text-[11px]">
                <span className="text-dark-muted">Or try another role:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFillCredentials('mentor@university.edu', 'mentor123', 'Mentor')}
                    className="px-2 py-0.5 rounded bg-dark-bg/60 hover:bg-dark-bg text-dark-muted hover:text-white border border-dark-border hover:border-primary-500/40 transition-colors cursor-pointer"
                  >
                    Mentor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillCredentials('23dcs001@charusat.edu.in', '23dcs001', 'Student')}
                    className="px-2 py-0.5 rounded bg-dark-bg/60 hover:bg-dark-bg text-dark-muted hover:text-white border border-dark-border hover:border-primary-500/40 transition-colors cursor-pointer"
                  >
                    Student
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base flex justify-center items-center gap-2 group shadow-lg shadow-primary-500/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border text-center">
            <p className="text-sm text-dark-muted">
              Need access? <span className="text-primary-400 font-medium">Contact Administrator</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
