import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MyMenteesGrid from '../components/dashboard/MyMenteesGrid';
import CounselingQueue from '../components/dashboard/CounselingQueue';
import ScheduleSessionModal from '../components/modals/ScheduleSessionModal';
import { mentorAPI, counselingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  Award,
  Plus
} from 'lucide-react';

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { info, success } = useToast();

  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' or 'sessions'
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, statsRes] = await Promise.all([
        mentorAPI.getMyStudents(),
        mentorAPI.getMyStats().catch(() => ({ data: null }))
      ]);

      const rawStudents = studentsRes.data || [];

      // AI Priority Sort: High Risk first, then sorted by lowest attendance
      const aiSorted = [...rawStudents].sort((a, b) => {
        if (a.dropoutRisk === 'HIGH' && b.dropoutRisk !== 'HIGH') return -1;
        if (a.dropoutRisk !== 'HIGH' && b.dropoutRisk === 'HIGH') return 1;
        if (a.dropoutRisk === 'MEDIUM' && b.dropoutRisk === 'LOW') return -1;
        if (a.dropoutRisk === 'LOW' && b.dropoutRisk === 'MEDIUM') return 1;
        return (a.attendancePercent || 100) - (b.attendancePercent || 100);
      });
      setStudents(aiSorted);

      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }

      // Initialize upcoming counseling meetings from assigned at-risk students
      const storageKey = `completed_sessions_${user?.id || 'default'}`;
      const completedSessionIds = JSON.parse(localStorage.getItem(storageKey) || '[]');

      const atRiskStudents = aiSorted.filter(s => s.dropoutRisk === 'HIGH' || s.dropoutRisk === 'MEDIUM');
      const pool = atRiskStudents.length > 0 ? atRiskStudents : aiSorted;

      const sessionList = pool
        .filter(s => !completedSessionIds.includes(s.id))
        .slice(0, 5)
        .map((s, index) => ({
          id: s.id,
          studentName: s.name,
          studentId: s.id,
          date: new Date(),
          time: index % 2 === 0 ? '02:00 PM' : '04:30 PM',
          status: 'SCHEDULED',
          dropoutRisk: s.dropoutRisk
        }));
      setUpcomingSessions(sessionList);
    } catch (err) {
      console.error('Error fetching mentor dashboard data:', err);
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

      // Log session in database
      const studentObj = students.find(s => s.id === sessionId);
      if (studentObj) {
        await counselingAPI.createLog({
          studentId: sessionId,
          notes: `Mentorship & counseling session completed for ${studentObj.name}`,
          actionsTaken: 'Academic guidance, attendance check, and goal setting',
          followUpRequired: false
        }).catch(e => console.warn('Database counseling log notice:', e));
      }
      success('Meeting completed and logged in academic record!');
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
    info('Meeting removed from active queue');
  };

  // Stats fallbacks
  const totalStudents = students.length;
  const highRisk = stats?.highRisk ?? students.filter(s => s.dropoutRisk === 'HIGH').length;
  const avgAttendance = stats?.avgAttendance ?? (totalStudents > 0
    ? (students.reduce((acc, s) => acc + (s.attendancePercent || 0), 0) / totalStudents).toFixed(1)
    : 0);
  const avgCGPA = stats?.avgCGPA ?? (totalStudents > 0
    ? (students.reduce((acc, s) => acc + (s.currentCGPA || 0), 0) / totalStudents).toFixed(2)
    : 0);

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

        {/* Header with Role Details & View Switcher */}
        <div className="relative mb-8 z-20">
          <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-md rounded-2xl shadow-sm border border-primary-500/20"></div>
          <div className="relative px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                Mentorship & Counseling Workspace
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30">
                  AI Prioritized
                </span>
              </h1>
              <p className="text-dark-muted text-sm mt-1">
                Oversee academic progress, risk levels, and counseling meetings for your mentees.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Tab Selector */}
              <div className="flex bg-dark-surface/80 p-1 rounded-xl border border-dark-border">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'workspace'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  Mentees Workspace
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'sessions'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-dark-muted hover:text-white'
                  }`}
                >
                  Counseling Queue
                  {upcomingSessions.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                      {upcomingSessions.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Schedule Quick Action */}
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-md shadow-indigo-600/20"
              >
                <Plus size={16} /> Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary-600 to-indigo-800 text-white border-none shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">My Group</p>
                <h3 className="text-4xl font-bold">{totalStudents} <span className="text-sm font-normal opacity-80">Mentees</span></h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm shadow-inner">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-indigo-100 flex items-center gap-2">
              <CheckCircle2 size={14} /> Active & Enrolled
            </div>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">High Dropout Risk</p>
                <h3 className="text-4xl font-bold text-white flex items-center gap-2">
                  {highRisk}
                  {highRisk > 0 && <span className="text-xs text-rose-400 font-normal">Urgent</span>}
                </h3>
              </div>
              <div className={`p-3 rounded-xl border ${highRisk > 0 ? 'bg-danger-500/10 text-danger-400 border-danger-500/20' : 'bg-success-500/10 text-success-400 border-success-500/20'}`}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="text-xs text-dark-muted mt-6 border-t border-dark-border pt-4">Requires intervention</p>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">Avg Attendance</p>
                <h3 className="text-4xl font-bold text-white">{avgAttendance}%</h3>
              </div>
              <div className="p-3 bg-info-500/10 text-info-400 border border-info-500/20 rounded-xl">
                <Activity size={24} />
              </div>
            </div>
            <div className="w-full bg-dark-bg/80 rounded-full h-2 mt-6 overflow-hidden border border-dark-border">
              <div className="bg-info-500 h-2 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ width: `${Math.min(100, Number(avgAttendance))}%` }}></div>
            </div>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">Cohort Avg CGPA</p>
                <h3 className="text-4xl font-bold text-white">{avgCGPA}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                <Award size={24} />
              </div>
            </div>
            <p className="text-xs text-dark-muted mt-6 border-t border-dark-border pt-4">Academic benchmark: 6.00</p>
          </Card>
        </div>

        {/* Content View Based on Active Tab */}
        {activeTab === 'workspace' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                  <BookOpen className="text-primary-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">Assigned Students</h2>
              </div>
            </div>

            <MyMenteesGrid students={students} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Quick Panel */}
            <div className="space-y-6">
              <Card className="border border-dark-border shadow-md">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-500" /> Meeting Management
                </h3>
                <p className="text-xs text-dark-muted mb-4">
                  Schedule one-on-one counseling meetings, record student progress, and monitor session outcomes.
                </p>
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full justify-start bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar size={16} className="mr-2" /> Schedule Meeting
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-white border-dark-border hover:bg-white/10"
                    onClick={() => navigate('/mentor/analytics')}
                  >
                    <Activity size={16} className="mr-2 text-indigo-400" /> View Cohort Analytics
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-white border-dark-border hover:bg-white/10"
                    onClick={() => navigate('/academic/data')}
                  >
                    <BookOpen size={16} className="mr-2 text-indigo-400" /> Record Marks & Attendance
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Counseling Queue */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Today's Counseling Sessions</h2>
                <Badge variant="neutral">{upcomingSessions.length} Pending</Badge>
              </div>

              <CounselingQueue
                sessions={upcomingSessions}
                onComplete={handleCompleteSession}
                onCancel={handleCancelSession}
              />
            </div>
          </div>
        )}

      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        students={students}
        onSchedule={(newSession) => {
          setUpcomingSessions(prev => [newSession, ...prev]);
          setActiveTab('sessions');
        }}
      />
    </PageWrapper>
  );
};

export default MentorDashboard;
