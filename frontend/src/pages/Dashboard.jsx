import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import StatsCard from '../components/dashboard/StatsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import {
  Users,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Eye,
  TrendingUp,
  Activity,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link, Navigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [highRiskStudents, setHighRiskStudents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all students (set high limit to get all records)
      const studentsData = await studentAPI.getAll({ limit: 10000 });
      const students = studentsData.data || studentsData;

      // Calculate statistics
      const totalStudents = students.length;
      const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
      const mediumRisk = students.filter(s => s.dropoutRisk === 'MEDIUM').length;
      const lowRisk = students.filter(s => s.dropoutRisk === 'LOW' || !s.dropoutRisk).length;

      // Get high risk students for table (top 5)
      const highRiskList = students
        .filter(s => s.dropoutRisk === 'HIGH')
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          name: s.name,
          studentId: s.studentId,
          attendance: Math.round(s.attendancePercent || 0),
          avgMarks: s.currentCGPA ? Math.round((s.currentCGPA / 10) * 100) : 0,
          riskLevel: 'HIGH'
        }));

      setStats({
        total: totalStudents,
        highRisk,
        mediumRisk,
        safe: lowRisk
      });

      setHighRiskStudents(highRiskList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
            <div className="mt-4 text-center text-primary-600 font-medium animate-pulse">Loading...</div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!stats) {
    return (
      <PageWrapper>
        <WelcomeBanner />
        <Card className="text-center py-12">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-white">Unable to load dashboard data</h3>
          <p className="text-dark-muted">Please check your connection and try again.</p>
        </Card>
      </PageWrapper>
    );
  }

  const riskDistribution = [
    { name: 'Low Risk', value: stats.safe, color: '#10B981' }, // Emerald 500
    { name: 'Medium Risk', value: stats.mediumRisk, color: '#F59E0B' }, // Amber 500
    { name: 'High Risk', value: stats.highRisk, color: '#F43F5E' }, // Rose 500
  ];

  // Dummy trend data for charts
  const performanceTrend = [
    { month: 'Jan', avg: 65 },
    { month: 'Feb', avg: 68 },
    { month: 'Mar', avg: 72 },
    { month: 'Apr', avg: 70 },
    { month: 'May', avg: 75 },
    { month: 'Jun', avg: 78 },
  ];

  const getRiskBadge = (level) => {
    const variants = {
      HIGH: 'danger',
      MEDIUM: 'warning',
      LOW: 'success',
    };
    return <Badge variant={variants[level]}>{level}</Badge>;
  };

  return (
    <PageWrapper>
      <div className="animate-slide-in">
        <WelcomeBanner />

        {/* Stats Grid - Masonry style inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Students"
            value={stats.total}
            icon={Users}
            trend={12}
            color="primary"
          />
          <StatsCard
            title="High Risk Alerts"
            value={stats.highRisk}
            icon={AlertTriangle}
            trend={-5}
            trendLabel="decreased vs last week"
            color="danger"
          />
          <StatsCard
            title="Avg Attendance"
            value="84%"
            icon={CheckCircle}
            trend={2.4}
            color="success"
          />
          <StatsCard
            title="Active Interventions"
            value="28"
            icon={Activity}
            trend={8}
            color="info"
          />
        </div>

        {/* Main Content Grid 2:1 Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* Left Column (Charts) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Chart */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Academic Performance Trend</h3>
                  <p className="text-sm text-dark-muted">Average CGPA over the last 6 months</p>
                </div>
                <Badge variant="success" className="px-3 py-1">+4.2% Growth</Badge>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTrend}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#272A30" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181A20', borderRadius: '12px', border: '1px solid #272A30', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', color: '#F3F4F6' }}
                    />
                    <Area type="monotone" dataKey="avg" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* High Risk Students Table */}
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between p-6 mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">High Risk Attention Needed</h3>
                  <p className="text-sm text-dark-muted">Students requiring immediate intervention</p>
                </div>
                <Link to="/students?risk=HIGH" className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                  View All <TrendingUp size={16} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-surface border-y border-dark-border">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Student</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">ID</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Attendance</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Marks</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Status</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/50">
                    {highRiskStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-danger-500/10 border border-danger-500/20 flex items-center justify-center text-danger-400 font-bold text-sm shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-dark-muted font-mono">{student.studentId}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${student.attendance < 75 ? 'bg-danger-500/10 text-danger-400 border-danger-500/20' : 'bg-success-500/10 text-success-400 border-success-500/20'}`}>
                            {student.attendance}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-medium text-white">{student.avgMarks}%</td>
                        <td className="py-4 px-6 text-center">{getRiskBadge(student.riskLevel)}</td>
                        <td className="py-4 px-6 text-center">
                          <Link
                            to={`/students/${student.id}`}
                            className="p-2 rounded-xl text-dark-muted hover:text-primary-400 hover:bg-primary-500/10 transition-all inline-block"
                          >
                            <Eye size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {highRiskStudents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-dark-muted">
                          No high risk students found. Great job!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-8">
            {/* Risk Distribution Donut */}
            <Card>
              <h3 className="text-lg font-bold text-white tracking-wide mb-4">Risk Overview</h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#181A20', borderRadius: '12px', border: '1px solid #272A30' }} itemStyle={{ color: '#F3F4F6' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Centered Total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-white tracking-tight">{stats.total}</span>
                  <span className="text-xs text-dark-muted uppercase tracking-wider font-semibold">Students</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }}></span>
                      <span className="text-dark-muted">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Activity Feed */}
            <RecentActivity />

            {/* Quick Promo / Insight */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white text-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="mx-auto mb-3 text-yellow-300 animate-pulse" size={28} />
              <h4 className="font-bold text-lg mb-2">AI Insights Ready</h4>
              <p className="text-indigo-100 text-sm mb-4">
                We've analyzed student performance patterns. 12 new recommendations available.
              </p>
              <button className="px-4 py-2 bg-dark-surface border border-dark-border text-primary-400 rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:border-primary-500/30 hover:scale-105 transition-all">
                View Recommendations
              </button>
            </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
