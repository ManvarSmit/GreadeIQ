import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { counselorAPI } from '../services/api';
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, AlertTriangle, Users, Award, BookOpen, Target, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CounselorAnalytics = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyStudents();
    }, []);

    const fetchMyStudents = async () => {
        try {
            setLoading(true);
            const response = await counselorAPI.getMyStudents();
            setStudents(response.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper title="My Students Analytics">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </PageWrapper>
        );
    }

    // Calculate statistics
    const totalStudents = students.length;
    const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
    const mediumRisk = students.filter(s => s.dropoutRisk === 'MEDIUM').length;
    const lowRisk = students.filter(s => s.dropoutRisk === 'LOW').length;

    const avgAttendance = totalStudents > 0
        ? (students.reduce((sum, s) => sum + (s.attendancePercent || 0), 0) / totalStudents).toFixed(1)
        : 0;

    const avgCGPA = totalStudents > 0
        ? (students.reduce((sum, s) => sum + (s.currentCGPA || 0), 0) / totalStudents).toFixed(2)
        : 0;

    const lowAttendance = students.filter(s => (s.attendancePercent || 0) < 75).length;
    const lowCGPA = students.filter(s => (s.currentCGPA || 0) < 6.0).length;

    // Risk distribution pie chart data
    const riskData = [
        { name: 'Low Risk', value: lowRisk, color: '#10B981' }, // Emerald-500
        { name: 'Medium Risk', value: mediumRisk, color: '#F59E0B' }, // Amber-500
        { name: 'High Risk', value: highRisk, color: '#EF4444' }, // Rose-500
    ].filter(item => item.value > 0);

    // Performance categories
    const performanceData = [
        { category: 'Excellent (>8)', count: students.filter(s => s.currentCGPA > 8).length },
        { category: 'Good (7-8)', count: students.filter(s => s.currentCGPA >= 7 && s.currentCGPA <= 8).length },
        { category: 'Average (6-7)', count: students.filter(s => s.currentCGPA >= 6 && s.currentCGPA < 7).length },
        { category: 'Critical (<6)', count: students.filter(s => s.currentCGPA < 6).length },
    ];

    // Attendance categories
    const attendanceData = [
        { category: '90%+', count: students.filter(s => s.attendancePercent >= 90).length },
        { category: '75-90%', count: students.filter(s => s.attendancePercent >= 75 && s.attendancePercent < 90).length },
        { category: '60-75%', count: students.filter(s => s.attendancePercent >= 60 && s.attendancePercent < 75).length },
        { category: 'Below 60%', count: students.filter(s => s.attendancePercent < 60).length },
    ];

    const statsCards = [
        {
            title: 'Assigned Students',
            value: totalStudents,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'hover:border-t-indigo-500'
        },
        {
            title: 'High Risk',
            value: highRisk,
            subtitle: `${totalStudents > 0 ? ((highRisk / totalStudents) * 100).toFixed(1) : 0}% of cohort`,
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'hover:border-t-rose-500'
        },
        {
            title: 'Avg CGPA',
            value: avgCGPA,
            subtitle: `${lowCGPA} students critical`,
            icon: Award,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'hover:border-t-purple-500'
        },
        {
            title: 'Avg Attendance',
            value: `${avgAttendance}%`,
            subtitle: `${lowAttendance} below 75%`,
            icon: Target,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'hover:border-t-emerald-500'
        },
    ];

    return (
        <PageWrapper title="My Students Analytics" subtitle="Performance overview of your assigned students">
            {totalStudents === 0 ? (
                <Card className="animate-fade-in">
                    <div className="text-center py-16">
                        <div className="bg-dark-bg w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users size={48} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Students Assigned</h3>
                        <p className="text-secondary-500 max-w-md mx-auto">You don't have any students assigned to you yet. Contact the administrator to get started.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-8 animate-fade-in pb-12">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statsCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className={`h-full flex flex-col items-start p-6 hover:shadow-xl transition-all hover:-translate-y-1 cursor-default border-t-4 border-t-transparent ${stat.border}`}>
                                        <div className="flex w-full items-center justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                                <Icon size={24} className={stat.color} />
                                            </div>
                                            {stat.subtitle && (
                                                <span className="text-xs font-medium px-2 py-1 bg-dark-surface rounded-full text-dark-muted">
                                                    Overview
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-secondary-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                                            <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                                            {stat.subtitle && (
                                                <p className="text-sm text-secondary-500 mt-2 font-medium flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    {stat.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Risk Distribution */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Risk Distribution</h3>
                                </div>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={riskData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
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
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Performance Distribution */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-primary">
                                        <Award size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">CGPA Performance</h3>
                                </div>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Attendance Analysis */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                    <BookOpen size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white">Attendance Overview</h3>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attendanceData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="category"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                                            width={100}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="#10B981" radius={[0, 6, 6, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </motion.div>

                    {/* High-Risk Students List */}
                    {highRisk > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="bg-dark-surface/80 backdrop-blur rounded-2xl border border-rose-950/40 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-rose-950/40 bg-rose-950/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-950/30 rounded-lg text-rose-500">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Priority Attention Required</h3>
                                            <p className="text-sm text-dark-muted">These students are flagged as High Risk</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-danger-500/10 text-danger-400 text-sm font-bold rounded-full shadow-md border border-danger-500/20">
                                        {highRisk} Students
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-dark-border bg-dark-bg/50">
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-muted">Student Name</th>
                                                <th className="text-center py-4 px-6 text-sm font-semibold text-dark-muted">Attendance</th>
                                                <th className="text-center py-4 px-6 text-sm font-semibold text-dark-muted">CGPA</th>
                                                <th className="text-center py-4 px-6 text-sm font-semibold text-dark-muted">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-border">
                                            {students
                                                .filter(s => s.dropoutRisk === 'HIGH')
                                                .map((student) => (
                                                    <tr key={student.id} className="hover:bg-dark-bg/80 transition-colors group">
                                                        <td className="py-4 px-6">
                                                            <div>
                                                                <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{student.name}</p>
                                                                <p className="text-xs text-secondary-500 font-mono">{student.studentId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`inline-block px-2 py-1 rounded bg-dark-surface text-sm font-bold ${student.attendancePercent < 75 ? 'text-rose-400 bg-rose-950/30' : 'text-dark-muted'}`}>
                                                                {student.attendancePercent || 0}%
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`inline-block px-2 py-1 rounded bg-dark-surface text-sm font-bold ${student.currentCGPA < 6 ? 'text-rose-400 bg-rose-950/30' : 'text-dark-muted'}`}>
                                                                {student.currentCGPA?.toFixed(2) || '0.00'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <Badge variant="danger" className="shadow-sm">HIGH RISK</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </PageWrapper>
    );
};

export default CounselorAnalytics;
