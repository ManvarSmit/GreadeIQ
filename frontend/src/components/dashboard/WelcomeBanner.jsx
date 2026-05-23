import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, FileText, BookOpen, Target } from 'lucide-react';
import Button from '../ui/Button';
import { studentAPI } from '../../services/api';

const WelcomeBanner = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('');
    const [highRiskCount, setHighRiskCount] = useState(0);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        // Fetch high-risk alerts count dynamically if user is admin/mentor/counselor
        if (user && user.role !== 'STUDENT') {
            const fetchStats = async () => {
                try {
                    const response = await studentAPI.getStats();
                    const stats = response.data || response;
                    if (stats && stats.byDropoutRisk) {
                        const highRiskEntry = stats.byDropoutRisk.find(
                            item => item.dropoutRisk === 'HIGH'
                        );
                        const count = highRiskEntry
                            ? (typeof highRiskEntry._count === 'object'
                                ? (highRiskEntry._count.id || highRiskEntry._count.studentId || 0)
                                : (highRiskEntry._count || 0))
                            : 0;
                        setHighRiskCount(count);
                    }
                } catch (error) {
                    console.error('Error fetching dynamic high-risk stats:', error);
                }
            };
            fetchStats();
        }
    }, [user]);

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-surface to-primary-900/40 text-white shadow-xl mb-8 border border-primary-500/20 glass-panel">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 backdrop-blur-md text-xs font-semibold uppercase tracking-wider border border-white/10 text-primary-300">
                            {user?.role || 'Admin'} Dashboard
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-300">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
                    </h1>
                    {user?.role === 'STUDENT' ? (
                        <p className="text-dark-muted max-w-xl text-lg">
                            Ready to ace your tests? Keep up the momentum and stay on top of your upcoming deadlines!
                        </p>
                    ) : (
                        <p className="text-dark-muted max-w-xl text-lg">
                            Here's what's happening with your students today. You have <span className="font-semibold text-danger-400">{highRiskCount} high-risk</span> alert{highRiskCount === 1 ? '' : 's'} requiring attention.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-4">
                    {user?.role === 'STUDENT' ? (
                        <>
                            <Button
                                onClick={() => navigate('/student/quizzes')}
                                className="bg-primary-600 text-white hover:bg-primary-500 border-none shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            >
                                <BookOpen size={18} className="mr-2" />
                                Available Quizzes
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    // Smooth scroll to the bottom chart or just a placeholder
                                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                }}
                                className="bg-dark-surface/50 text-dark-text hover:bg-white/10 border border-dark-border backdrop-blur-md"
                            >
                                <Target size={18} className="mr-2" />
                                My Performance
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/reports')}
                                className="bg-dark-surface/50 text-dark-text hover:bg-white/10 border border-dark-border backdrop-blur-md"
                            >
                                <FileText size={18} className="mr-2" />
                                Verify Report
                            </Button>
                            <Button
                                onClick={() => navigate('/students')}
                                className="bg-primary-600 text-white hover:bg-primary-500 border-none shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            >
                                <Plus size={18} className="mr-2" />
                                Add New Student
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomeBanner;
