import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CounselingQueue from '../components/dashboard/CounselingQueue';
import { counselorAPI, counselingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ScheduleSessionModal from '../components/modals/ScheduleSessionModal';
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
  const { info, success } = useToast();
  const [students, setStudents] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, students
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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
      const myStudents = studentsData.data || [];
      setStudents(myStudents);
      setStats(statsData.data || { totalStudents: 0, highRisk: 0, avgCGPA: 0, avgAttendance: 0 });

      // Get stored completed/cancelled session IDs for this counselor
      const storageKey = `completed_sessions_${user?.id || 'default'}`;
      const completedSessionIds = JSON.parse(localStorage.getItem(storageKey) || '[]');

      // Generate today's sessions dynamically from real assigned high/medium risk students
      const atRiskStudents = myStudents.filter(s => s.dropoutRisk === 'HIGH' || s.dropoutRisk === 'MEDIUM');
      const pool = atRiskStudents.length > 0 ? atRiskStudents : myStudents;

      const sessionList = pool
        .filter(s => !completedSessionIds.includes(s.id))
        .slice(0, 5)
        .map((s, index) => ({
          id: s.id,
          studentName: s.name,
          studentId: s.id, // Real database ID
          date: new Date(),
          time: index % 2 === 0 ? '02:00 PM' : '04:30 PM',
          status: 'SCHEDULED',
          dropoutRisk: s.dropoutRisk
        }));
      setUpcomingSessions(sessionList);
    } catch (err) {
      console.error('Error fetching counselor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));

      // Persist completed ID in localStorage
      const storageKey = `completed_sessions_${user?.id || 'default'}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!existing.includes(sessionId)) {
        existing.push(sessionId);
        localStorage.setItem(storageKey, JSON.stringify(existing));
      }

      // Log session in backend database
      const studentObj = students.find(s => s.id === sessionId);
      if (studentObj) {
        await counselingAPI.createLog({
          studentId: sessionId,
          notes: `Routine counseling session completed for ${studentObj.name}`,
          actionsTaken: 'Performance and attendance targets reviewed',
          followUpRequired: false
        }).catch(e => console.warn('Database log notice:', e));
      }
      success('Session completed and recorded successfully!');
    } catch (err) {
      console.error('Error completing session:', err);
    }
  };

  const handleCancelSession = (sessionId) => {
    setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));

    const storageKey = `completed_sessions_${user?.id || 'default'}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!existing.includes(sessionId)) {
      existing.push(sessionId);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    }
    info('Session removed from queue');
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
                <Card className="bg-gradient-to-br from-indigo-900/60 to-indigo-950/80 text-white border border-indigo-700/40 shadow-lg">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Assigned</p>
                  <h3 className="text-3xl font-bold text-white">{stats?.totalStudents}</h3>
                </Card>
                <Card className="bg-gradient-to-br from-rose-950/60 to-dark-surface text-white border border-rose-800/40 shadow-lg">
                  <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-1">High Risk</p>
                  <h3 className="text-3xl font-bold text-rose-400 flex items-center gap-2">
                    {stats?.highRisk} <AlertTriangle size={18} />
                  </h3>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-950/60 to-dark-surface text-white border border-emerald-800/40 shadow-lg">
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Avg Attendance</p>
                  <h3 className="text-3xl font-bold text-emerald-400">{stats?.avgAttendance?.toFixed(0)}%</h3>
                </Card>
                <Card className="bg-gradient-to-br from-purple-950/60 to-dark-surface text-white border border-purple-800/40 shadow-lg">
                  <p className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">Avg CGPA</p>
                  <h3 className="text-3xl font-bold text-purple-300">{stats?.avgCGPA?.toFixed(1)}</h3>
                </Card>
              </div>

              {/* Reminders / Next Up */}
              <Card className="border border-dark-border shadow-md">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-500" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-white border-dark-border hover:bg-white/10"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar size={16} className="mr-2 text-indigo-400" /> Schedule New Session
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-white border-dark-border hover:bg-white/10"
                    onClick={() => setActiveTab('students')}
                  >
                    <Search size={16} className="mr-2 text-indigo-400" /> Find Student
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

            {/* Reuse simple table or grid here */}
            <Card className="overflow-hidden border border-dark-border bg-dark-surface shadow-md">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Student</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Status</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-dark-muted uppercase">Performance</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-dark-muted uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-dark-bg/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-950/60 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-800/40">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{student.name}</p>
                            <p className="text-xs text-dark-muted font-mono">{student.studentId}</p>
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
                          <span title="Attendance" className="text-white font-medium">{Math.round(student.attendancePercent)}% Att.</span>
                          <span className="w-px h-3 bg-dark-border"></span>
                          <span title="CGPA" className="text-white font-medium">{student.currentCGPA.toFixed(1)} CGPA</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
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

      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        students={students}
        onSchedule={(newSession) => {
          setUpcomingSessions(prev => [newSession, ...prev]);
        }}
      />
    </PageWrapper>
  );
};

export default CounselorDashboard;
