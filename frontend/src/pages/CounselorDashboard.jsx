import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CounselingQueue from '../components/dashboard/CounselingQueue';
import { counselorAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, statsData] = await Promise.all([
        counselorAPI.getMyStudents(),
        counselorAPI.getMyStats()
      ]);
      setStudents(studentsData.data || []);
      setStats(statsData.data || { totalStudents: 0, highRisk: 0, avgCGPA: 0, avgAttendance: 0 });
    } catch (err) {
      console.error('Error fetching counselor data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock sessions for the queue (since we might not have real session data yet)
  const [upcomingSessions, setUpcomingSessions] = useState([
    { id: 1, studentName: 'Kunal Joshi', studentId: '23DCS045', date: new Date(), time: '02:00 PM', status: 'SCHEDULED', dropoutRisk: 'HIGH' },
    { id: 2, studentName: 'Priya Sharma', studentId: '24DCS012', date: new Date(), time: '04:30 PM', status: 'SCHEDULED', dropoutRisk: 'MEDIUM' },
  ]);

  const handleCompleteSession = (id) => {
    setUpcomingSessions(prev => prev.filter(s => s.id !== id));
    // Call API to complete session
  };

  const handleCancelSession = (id) => {
    setUpcomingSessions(prev => prev.filter(s => s.id !== id));
    // Call API to cancel session
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">

        {/* Glass Header */}
        <div className="relative mb-8 z-20">
          <div className="absolute inset-0 bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-lg border border-dark-border"></div>
          <div className="relative px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
              <p className="text-dark-muted text-sm">Here's what's happening in your counseling queue today.</p>
            </div>
            <div className="flex bg-dark-surface/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-600' : 'text-dark-muted hover:text-dark-muted'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-white shadow-sm text-indigo-600' : 'text-dark-muted hover:text-dark-muted'}`}
              >
                My Students
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Stats & Quick Actions */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-indigo-600 text-white border-none shadow-indigo-200 shadow-lg">
                  <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Total Assigned</p>
                  <h3 className="text-3xl font-bold">{stats?.totalStudents}</h3>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">High Risk</p>
                  <h3 className="text-3xl font-bold text-red-500 flex items-center gap-2">
                    {stats?.highRisk} <AlertTriangle size={18} />
                  </h3>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Avg Attendance</p>
                  <h3 className="text-3xl font-bold text-white">{stats?.avgAttendance?.toFixed(0)}%</h3>
                </Card>
                <Card className="bg-white border-none shadow-sm">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Avg CGPA</p>
                  <h3 className="text-3xl font-bold text-white">{stats?.avgCGPA?.toFixed(1)}</h3>
                </Card>
              </div>

              {/* Reminders / Next Up */}
              <Card className="border-none shadow-md">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-500" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-dark-muted"
                    onClick={() => {
                      setActiveTab('students');
                      info('Open a student profile and use the counseling section to add a session.');
                    }}
                  >
                    <Calendar size={16} className="mr-2" /> Schedule New Session
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-dark-muted"
                    onClick={() => setActiveTab('students')}
                  >
                    <Search size={16} className="mr-2" /> Find Student
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Counseling Queue */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Today's Sessions</h2>
                <Badge variant="neutral">{upcomingSessions.length} Pending</Badge>
              </div>

              <CounselingQueue
                sessions={upcomingSessions}
                onComplete={handleCompleteSession}
                onCancel={handleCancelSession}
              />
            </div>

          </div>
        ) : (
          /* Students List Tab */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your students..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="text-dark-muted text-sm">
                Showing <strong>{filteredStudents.length}</strong> students
              </div>
            </div>

            {/* Reuse simple table or grid here, for now simple styled table */}
            <Card className="overflow-hidden border-none shadow-md">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Student</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Performance</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-dark-muted uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-dark-bg/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{student.name}</p>
                            <p className="text-xs text-dark-muted">{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={student.dropoutRisk === 'HIGH' ? 'danger' : student.dropoutRisk === 'MEDIUM' ? 'warning' : 'success'}>
                          {student.dropoutRisk}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4 text-sm text-dark-muted">
                          <span title="Attendance">{Math.round(student.attendancePercent)}% Att.</span>
                          <span className="w-px h-3 bg-slate-300"></span>
                          <span title="CGPA">{student.currentCGPA.toFixed(1)} CGPA</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-indigo-600 hover:bg-indigo-50"
                          onClick={() => navigate(`/students/${student.id}`)}
                        >
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-dark-muted">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default CounselorDashboard;
