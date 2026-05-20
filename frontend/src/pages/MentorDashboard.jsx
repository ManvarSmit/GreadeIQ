import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import MyMenteesGrid from '../components/dashboard/MyMenteesGrid';
import { mentorAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

const MentorDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const data = await mentorAPI.getMyStudents();
      const rawStudents = data.data || [];
      
      // AI Priority Sort: High Risk first, then sorted by lowest attendance
      const aiSorted = [...rawStudents].sort((a, b) => {
          if (a.dropoutRisk === 'HIGH' && b.dropoutRisk !== 'HIGH') return -1;
          if (a.dropoutRisk !== 'HIGH' && b.dropoutRisk === 'HIGH') return 1;
          if (a.dropoutRisk === 'MEDIUM' && b.dropoutRisk === 'LOW') return -1;
          if (a.dropoutRisk === 'LOW' && b.dropoutRisk === 'MEDIUM') return 1;
          return (a.attendancePercent || 100) - (b.attendancePercent || 100);
      });
      setStudents(aiSorted);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalStudents = students.length;
  const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
  const avgAttendance = totalStudents > 0
    ? students.reduce((acc, s) => acc + (s.attendancePercent || 0), 0) / totalStudents
    : 0;

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
          <div className="absolute inset-0 bg-dark-bg/40 backdrop-blur-md rounded-2xl shadow-sm border border-primary-500/20"></div>
          <div className="relative px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Mentorship Workspace <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full border border-primary-500/30 ml-2">AI Prioritized</span></h1>
              <p className="text-dark-muted text-sm mt-1">Track progress and guide your assigned students efficiently.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-dark-surface text-primary-400 px-4 py-2 rounded-xl font-bold text-sm border border-dark-border flex items-center gap-3 glass-panel">
                <img
                  src={`https://ui-avatars.com/api/?name=${user?.name}&background=181A20&color=6366f1`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border border-primary-500/30"
                />
                <div className="flex flex-col">
                  <span className="text-white">{user?.name}</span>
                  <span className="text-xs text-dark-muted font-normal">{user?.specialization || 'General Mentor'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">Attention Needed</p>
                <h3 className="text-4xl font-bold text-white">{highRisk}</h3>
              </div>
              <div className={`p-3 rounded-xl border ${highRisk > 0 ? 'bg-danger-500/10 text-danger-400 border-danger-500/20' : 'bg-success-500/10 text-success-400 border-success-500/20'}`}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="text-xs text-dark-muted mt-6 border-t border-dark-border pt-4">Students marked as High Risk</p>
          </Card>

          <Card className="bg-dark-surface border-dark-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-2">Group Avg Attendance</p>
                <h3 className="text-4xl font-bold text-white">{avgAttendance.toFixed(1)}%</h3>
              </div>
              <div className="p-3 bg-info-500/10 text-info-400 border border-info-500/20 rounded-xl">
                <Activity size={24} />
              </div>
            </div>
            <div className="w-full bg-dark-bg/80 rounded-full h-2 mt-6 overflow-hidden border border-dark-border">
              <div className="bg-info-500 h-2 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ width: `${avgAttendance}%` }}></div>
            </div>
          </Card>
        </div>

        {/* Mentees Grid */}
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

      </div>
    </PageWrapper>
  );
};

export default MentorDashboard;
