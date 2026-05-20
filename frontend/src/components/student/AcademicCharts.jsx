import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, BookOpen } from 'lucide-react';
import Card from '../ui/Card';

const AcademicCharts = ({ student }) => {
    // Mock Data Generators based on current stats
    const generateTrend = (current, key) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
        return months.map((m, i) => ({
            month: m,
            value: Math.max(40, Math.min(100, current + (Math.random() * 10 - 5) - ((4 - i) * 2))) // mildly randomized trend
        }));
    };

    const attendanceData = generateTrend(student.attendancePercent || 75, 'attendance');
    const marksData = generateTrend((student.currentCGPA || 6) * 9.5, 'marks'); // rough conversion to %

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Chart */}
            <Card className="flex flex-col border-none shadow-md shadow-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Attendance Trend</p>
                            <h3 className="font-bold text-white">{Math.round(student.attendancePercent)}% Average</h3>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={attendanceData}>
                            <defs>
                                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* CGPA Chart */}
            <Card className="flex flex-col border-none shadow-md shadow-slate-200/50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Performance Trend</p>
                            <h3 className="font-bold text-white">CGPA {(student.currentCGPA || 0).toFixed(1)}</h3>
                        </div>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marksData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default AcademicCharts;
