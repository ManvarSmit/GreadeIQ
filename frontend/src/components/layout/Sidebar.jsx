import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Database,
  Menu,
  X,
  BookOpen,
  ClipboardList,
  ShieldAlert,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth(); // Added logout

  const role = user?.role || 'GUEST';

  // Define menus per role
  const allMenuItems = [
    // Common / Admin
    { path: '/', icon: LayoutDashboard, label: 'Overview', roles: ['ADMIN'] },

    // Mentor Specific
    { path: '/mentor/my-students', icon: BookOpen, label: 'My Students', roles: ['MENTOR'] },

    // Counselor Specific
    { path: '/counseling/queue', icon: ClipboardList, label: 'Counseling Queue', roles: ['COUNSELOR'] },
    { path: '/counseling/analytics', icon: BarChart3, label: 'My Analytics', roles: ['COUNSELOR'] },
    { path: '/counseling/data', icon: Database, label: 'Manage Data', roles: ['COUNSELOR'] },
    { path: '/counseling/quizzes', icon: BookOpen, label: 'Manage Quizzes', roles: ['COUNSELOR', 'ADMIN', 'MENTOR'] },

    // Student Specific
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'My Dashboard', roles: ['STUDENT'] },
    { path: '/student/quizzes', icon: BookOpen, label: 'My Quizzes', roles: ['STUDENT'] },

    // General Students List (Admin and Mentor only - Counselors see only assigned students)
    { path: '/students', icon: Users, label: 'Student Directory', roles: ['ADMIN', 'MENTOR'] },

    // Admin / Advanced
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN'] },
    { path: '/reports', icon: FileText, label: 'Reports', roles: ['ADMIN'] },
    { path: '/data-management', icon: Database, label: 'Data Management', roles: ['ADMIN'] },
    { path: '/admin', icon: ShieldAlert, label: 'Admin Console', roles: ['ADMIN'] },
  ];

  // Filter items
  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-dark-surface border border-dark-border shadow-lg text-dark-text"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-dark-surface text-dark-text z-40
          transition-transform duration-300 ease-in-out border-r border-dark-border/50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-72 flex flex-col shadow-2xl font-sans
        `}
      >
        {/* Header */}
        <div className="h-20 flex items-center px-8 bg-dark-surface/80 backdrop-blur-md border-b border-dark-border/50">
          <div className="flex items-center gap-3 text-primary-400">
            <div className="p-2.5 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl border border-primary-500/20">
              <LayoutDashboard size={24} className="text-primary-400" />
            </div>
            <span className="text-xl font-bold tracking-wide text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-muted">GradeIQ</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                  ${active
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'text-dark-muted hover:bg-white/5 hover:text-white border border-transparent'
                  }
                `}
              >
                <Icon size={20} className={`relative z-10 transition-colors duration-300 ${active ? 'text-primary-400' : 'text-dark-muted group-hover:text-primary-400/80'}`} />
                <span className="font-medium text-[15px] tracking-wide relative z-10">{item.label}</span>
                {active && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-md shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="p-6 mt-auto bg-gradient-to-t from-dark-bg/80 to-transparent">
          <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel hover:border-primary-500/30 transition-all duration-300 group cursor-pointer shadow-none">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate tracking-wide">{user?.name || 'User'}</p>
              <p className="text-xs text-primary-400/80 truncate capitalize tracking-wider font-medium">{user?.role?.toLowerCase() || 'Guest'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-dark-muted hover:text-danger-400 hover:bg-danger-500/10 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
