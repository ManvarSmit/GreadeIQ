import { User, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Topbar = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();

  const getRoleDisplay = () => {
    if (!user) return '';

    if (user.role === 'MENTOR') {
      return user.specialization
        ? `Mentor - ${user.specialization}`
        : 'Mentor';
    }

    // Capitalize first letter
    if (user.role === 'ADMIN') return 'Administrator';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  return (
    <header className="sticky top-0 z-30 w-full transition-all duration-300">
      <div className="absolute inset-0 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border shadow-[0_4px_30px_rgba(0,0,0,0.5)]"></div>

      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 lg:ml-0 ml-12">
          {/* Mobile Menu Trigger Placeholder (Handled by Sidebar usually) */}
          <h2 className="text-xl font-bold text-white tracking-tight hidden md:block">{title}</h2>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-dark-border rounded-xl leading-5 bg-dark-bg/50 text-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 sm:text-sm"
              placeholder="Search students, reports, or settings..."
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => info('No new notifications. Alerts will appear here when available.')}
            className="relative p-2 rounded-full text-dark-muted hover:bg-white/10 hover:text-primary-400 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-dark-surface" aria-hidden />
          </button>

          <div className="h-8 w-px bg-dark-border mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => navigate('/change-password')}
            className="flex items-center gap-3 pl-2 rounded-xl py-1 pr-1 hover:bg-white/5 transition-colors text-left"
            aria-label="Account and change password"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs font-medium text-dark-muted">{getRoleDisplay()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 border border-primary-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow shrink-0">
              <User size={20} className="text-primary-700" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
