import Card from '../ui/Card';
import { AlertCircle } from 'lucide-react';

const SubjectHeatmap = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[300px]">
                <p className="text-slate-400">No subject data available</p>
            </Card>
        );
    }

    // Get unique subjects and departments
    const subjects = [...new Set(data.map(d => d.subject))];
    const departments = [...new Set(data.map(d => d.department))];

    // Create matrix
    const matrix = {};
    data.forEach(item => {
        const key = `${item.subject}|${item.department}`;
        matrix[key] = item;
    });

    const getCellColor = (failureRate) => {
        if (failureRate >= 30) return 'bg-red-500/90 text-white shadow-red-200';
        if (failureRate >= 20) return 'bg-orange-400/90 text-white shadow-orange-200';
        if (failureRate >= 10) return 'bg-yellow-400/90 text-white shadow-yellow-200';
        return 'bg-emerald-100 text-emerald-700';
    };

    return (
        <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white">Subject Failure Heatmap</h3>
                    <p className="text-xs text-dark-muted">Cross-departmental failure analysis</p>
                </div>
            </div>

            <div className="overflow-x-auto pb-4">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 text-left text-xs font-bold text-dark-muted uppercase tracking-wider sticky left-0 bg-dark-surface z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                Subject
                            </th>
                            {departments.map(dept => (
                                <th key={dept} className="p-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[100px]">
                                    {dept}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {subjects.map(subject => (
                            <tr key={subject} className="group">
                                <td className="p-3 text-sm font-semibold text-white sticky left-0 bg-dark-surface group-hover:bg-dark-bg transition-colors z-10 border-r border-dark-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                    {subject}
                                </td>
                                {departments.map(dept => {
                                    const item = matrix[`${subject}|${dept}`];

                                    if (!item) {
                                        return (
                                            <td key={dept} className="p-2 text-center bg-dark-bg/50">
                                                <span className="text-xs text-slate-300">-</span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={dept} className="p-2">
                                            <div
                                                className={`
                          mx-auto w-full h-12 rounded-lg flex flex-col items-center justify-center 
                          transition-transform hover:scale-105 hover:shadow-lg cursor-help
                          ${getCellColor(item.failureRate)}
                        `}
                                                title={`${item.department}: ${item.failureRate}% Failures (${item.failures}/${item.total})`}
                                            >
                                                <span className="text-sm font-bold">{item.failureRate}%</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-end gap-6 mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center gap-2 text-xs text-dark-muted">
                    <span className="w-3 h-3 rounded-full bg-emerald-100"></span> {'< 10%'}
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-muted">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span> 10-20%
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-muted">
                    <span className="w-3 h-3 rounded-full bg-orange-400"></span> 20-30%
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-muted">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> {'> 30%'}
                </div>
            </div>
        </Card>
    );
};

export default SubjectHeatmap;
