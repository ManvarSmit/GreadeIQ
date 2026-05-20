import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import { Lock, ShieldCheck, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { success, error: toastError, warning } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      warning('New passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      warning('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      success('Password changed successfully! You can now access your dashboard.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100 opacity-80"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 p-4"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-lg mb-6 text-white"
            >
              <KeyRound size={32} />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Set New Password</h1>
            <p className="text-dark-muted mt-2">
              For your security, please update your temporary password.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3 text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-1.5 ml-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    placeholder="Enter temporary password"
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              <div className="relative group">
                <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck size={18} className="text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base flex justify-center items-center gap-2 group bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white border-transparent"
              disabled={loading}
            >
              {loading ? 'Updating...' : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
