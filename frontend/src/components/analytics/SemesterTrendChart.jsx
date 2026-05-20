import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { TrendingUp } from 'lucide-react';

const SemesterTrendChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <Card className="h-full border-none shadow-md shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-white">Academic Trajectory Analysis</h3>
                </div>
            </div>

            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="semester" scale="band" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'Semester', position: 'insideBottom', offset: -5 }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#10b981" axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#6366f1" axisLine={false} tickLine={false} domain={[0, 10]} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="avgAttendance" name="Avg Attendance %" fill="url(#colorAttendance)" stroke="#10b981" />
                        <Line yAxisId="right" type="monotone" dataKey="avgCGPA" name="Avg CGPA" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default SemesterTrendChart;
