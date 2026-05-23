import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ExportButton from '../components/ui/ExportButton';
import UserManagementSection from '../components/admin/UserManagementSection';
import { analyticsAPI, authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Building2,
  UserCheck,
  FileText,
  BarChart3,
  UserPlus,
  Mail,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { success, error } = useToast();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');

  // Create User State
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'MENTOR', specialization: '' });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchInsights();
  }, [selectedSemester]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const params = selectedSemester ? { semester: selectedSemester } : {};
      const data = await analyticsAPI.getAdminInsights(params);
      setInsights(data.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    try {
      await authAPI.createUser(newUser);
      success(`User ${newUser.email} created successfully! Credentials sent.`);
      setNewUser({ name: '', email: '', role: 'MENTOR', specialization: '' });
      // Optionally refresh stats if impactful
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  if (loading && !insights) {
    return (
      <PageWrapper title="Command Center" subtitle="System-wide overview and administration">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!loading && !insights) {
    return (
      <PageWrapper title="Command Center">
        <Card className="text-center py-12">
          <AlertTriangle size={48} className="mx-auto text-rose-400 mb-4" />
          <h3 className="text-lg font-bold text-white">Failed to load insights</h3>
          <p className="text-secondary-500 mb-6">There was an issue fetching the dashboard data.</p>
          <Button onClick={fetchInsights} variant="primary">
            Retry Connection
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  const riskData = insights ? [
    { name: 'High Risk', value: insights.overview.highRiskStudents, color: '#F43F5E' },
    { name: 'Medium Risk', value: insights.overview.mediumRiskStudents, color: '#F59E0B' },
    { name: 'Low Risk', value: insights.overview.lowRiskStudents, color: '#10B981' }
  ].filter(d => d.value > 0) : [];

  const kpis = insights ? [
    {
      title: 'Total Students',
      value: insights.overview.totalStudents,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'hover:border-indigo-500/30'
    },
    {
      title: 'Departments',
      value: insights.overview.totalDepartments,
      icon: Building2,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'hover:border-sky-500/30'
    },
    {
      title: 'High Risk',
      value: insights.overview.highRiskStudents,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'hover:border-rose-500/30'
    },
    {
      title: 'Interventions',
      value: insights.interventions.total,
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'hover:border-emerald-500/30'
    },
    {
      title: 'Avg CGPA',
      value: insights.overview.avgCGPA,
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'hover:border-violet-500/30'
    },
    {
      title: 'Avg Attendance',
      value: `${insights.overview.avgAttendance}%`,
      icon: BarChart3,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'hover:border-amber-500/30'
    }
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageWrapper title="Command Center" subtitle="System-wide overview and administration">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-12"
      >
        {/* Controls */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-4 bg-dark-surface border border-dark-border shadow-lg p-4 rounded-xl">

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="pl-9 pr-8 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm font-medium text-white hover:border-primary-500/50 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none cursor-pointer outline-none shadow-md"
              >
                <option value="">All Semesters</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Button
              onClick={fetchInsights}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex gap-2">
              <ExportButton type="csv" reportType="students" filters={selectedSemester ? { semester: selectedSemester } : {}} />
              <ExportButton type="pdf" reportType="admin-insights" />
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className={`h-full border-t-4 border-t-transparent ${kpi.border} transition-all hover:-translate-y-1 hover:shadow-lg cursor-default`}>
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${kpi.bg}`}>
                        <Icon size={20} className={kpi.color} />
                      </div>
                    </div>
                    <div>
                      <p className="text-secondary-500 text-xs font-semibold uppercase tracking-wider mb-1">{kpi.title}</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">{kpi.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area (Left) */}
          <div className="xl:col-span-2 space-y-8">

            {/* User Management */}
            <motion.div variants={itemVariants}>
              <UserManagementSection />
            </motion.div>

            {/* Top Departments Table */}
            <motion.div variants={itemVariants}>
              <div className="bg-dark-surface/80 backdrop-blur rounded-2xl border border-dark-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-bg/50">
                  <h3 className="text-lg font-bold text-white">Risk Analysis by Department</h3>
                  <Link to="/advanced-analytics" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1 group">
                    Full Report
                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark-bg border-b border-dark-border">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Department</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Total</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold text-rose-500 uppercase tracking-wider">High Risk</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold text-amber-500 uppercase tracking-wider">Med Risk</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Risk %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {insights.departmentRisk.map((dept, index) => (
                        <tr key={index} className="hover:bg-dark-bg/80 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-white">{dept.department}</td>
                          <td className="py-4 px-6 text-sm text-center text-dark-muted font-medium">{dept.total}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${dept.high > 0 ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400'}`}>
                              {dept.high}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${dept.medium > 0 ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400'}`}>
                              {dept.medium}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge variant={dept.highPercent > 15 ? 'danger' : dept.highPercent > 8 ? 'warning' : 'neutral'}>
                              {dept.highPercent}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area (Right) */}
          <div className="space-y-8">

            {/* Create User Card */}
            <motion.div variants={itemVariants}>
              <Card className="border-t-4 border-t-indigo-500 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <UserPlus size={100} className="text-indigo-500" />
                </div>

                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <UserPlus size={20} className="text-indigo-400" />
                  </div>
                  Provision Access
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4 relative z-10">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-dark-muted uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2.5 bg-dark-bg text-white border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      placeholder="e.g. Dr. Jane Smith"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-dark-muted uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2.5 bg-dark-bg text-white border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      placeholder="jane@university.edu"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-dark-muted uppercase tracking-wide">Role</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-2.5 bg-dark-bg text-white border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none outline-none"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="MENTOR">Mentor</option>
                        <option value="COUNSELOR">Counselor</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Specialization */}
                  {newUser.role === 'MENTOR' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1"
                    >
                      <label className="text-xs font-semibold text-dark-muted uppercase tracking-wide">Specialization</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-2.5 bg-dark-bg text-white border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none outline-none"
                          value={newUser.specialization}
                          onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                        >
                          <option value="">General Mentoring</option>
                          <option value="Academic Support">Academic Support</option>
                          <option value="Family Counseling">Family Counseling</option>
                          <option value="Financial Guidance">Financial Guidance</option>
                          <option value="Mental Health Support">Mental Health Support</option>
                          <option value="Grief Counseling">Grief Counseling</option>
                          <option value="Career Guidance">Career Guidance</option>
                          <option value="Addiction Counseling">Addiction Counseling</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={createUserLoading}
                    className="w-full mt-4 h-11 text-base shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {createUserLoading ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Mail size={18} />
                    )}
                    <span>{createUserLoading ? 'Sending Credentials...' : 'Create & Send Access'}</span>
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Risk Distribution Chart */}
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-rose-500/10 rounded-lg">
                    <AlertTriangle size={18} className="text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Risk Profile</h3>
                </div>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{insights.overview.totalStudents}</p>
                      <p className="text-xs text-secondary-500 font-medium uppercase tracking-wide">Total</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </PageWrapper>
  );
};

export default AdminDashboard;
