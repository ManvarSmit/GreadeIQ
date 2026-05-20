import { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/dashboard/StatsCard';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner';
import { useAuth } from '../../contexts/AuthContext';
import { quizAPI } from '../../services/api';
import { BookOpen, CheckCircle, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [pastAttempts, setPastAttempts] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const attemptsRes = await quizAPI.getPastAttempts();
        setPastAttempts(attemptsRes.data || []);
      } catch (err) {
        console.error("Failed to load past attempts", err);
      }
    };
    fetchDashboardData();
  }, []);

  // Mock data for student
  const stats = {
    attendance: 86,
    cgpa: 8.4,
    riskScore: 'LOW',
    upcomingTests: 2
  };

  const performanceTrend = [
    { month: 'Jan', cgpa: 7.8 },
    { month: 'Feb', cgpa: 8.0 },
    { month: 'Mar', cgpa: 8.1 },
    { month: 'Apr', cgpa: 8.2 },
    { month: 'May', cgpa: 8.4 },
  ];

  return (
    <PageWrapper>
      <div className="animate-slide-in">
        <WelcomeBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Attendance"
            value={`${stats.attendance}%`}
            icon={CheckCircle}
            trend={2.5}
            color={stats.attendance > 75 ? 'success' : 'danger'}
          />
          <StatsCard
            title="Current CGPA"
            value={stats.cgpa}
            icon={TrendingUp}
            trend={0.2}
            color="primary"
          />
          <StatsCard
            title="Risk Status"
            value={stats.riskScore}
            icon={AlertCircle}
            trendLabel="Based on AI analysis"
            color="info"
          />
          <StatsCard
            title="Upcoming Tests"
            value={stats.upcomingTests}
            icon={BookOpen}
            color="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">CGPA Progress</h3>
                  <p className="text-sm text-dark-muted">Your performance over the semester</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceTrend}>
                    <defs>
                      <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#272A30" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B949E' }} domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: '#181A20', borderRadius: '12px', border: '1px solid #272A30' }} itemStyle={{ color: '#F3F4F6' }} />
                    <Area type="monotone" dataKey="cgpa" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCgpa)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <h3 className="text-lg font-bold text-white tracking-wide mb-6">Recent Completed Quizzes</h3>
              <div className="space-y-4">
                {pastAttempts.length > 0 ? (
                  pastAttempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer border border-dark-border">
                      <div className="p-3 rounded-xl h-fit flex-shrink-0 bg-primary-500/10 text-primary-400 border border-primary-500/20">
                          <CheckCircle size={20} />
                      </div>
                      <div className="flex-1">
                          <p className="text-[15px] font-medium text-white group-hover:text-primary-400 transition-colors">{attempt.quiz.title}</p>
                          <p className="text-xs text-dark-muted mt-1">Score: {attempt.score} / {attempt.quiz._count?.questions || 0}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Completed</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 border border-dashed border-dark-border rounded-xl bg-dark-bg/50">
                    <p className="text-sm text-dark-muted">No completed quizzes yet.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default StudentDashboard;
