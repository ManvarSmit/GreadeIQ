import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { PieChart as PieIcon } from 'lucide-react';

const DepartmentRiskChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
                <p className="text-slate-400">No department data available</p>
            </Card>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-dark-border shadow-xl rounded-xl">
                    <p className="font-bold text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-dark-muted capitalize">{entry.name}:</span>
                            <span className="font-bold text-dark-muted">{entry.value}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-dark-border">
                        <p className="text-xs text-slate-400 font-bold uppercase">Total Students</p>
                        <p className="font-bold text-indigo-600">{payload.reduce((acc, curr) => acc + curr.value, 0)}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full border-none shadow-md shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <PieIcon size={20} />
                    </div>
                    <h3 className="font-bold text-white">Department Risk Profile</h3>
                </div>
            </div>

            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Legend iconType="circle" />
                        <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default DepartmentRiskChart;
