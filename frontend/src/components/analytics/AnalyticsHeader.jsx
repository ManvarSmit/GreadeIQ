import { Download, Filter, Calendar } from 'lucide-react';
import Button from '../ui/Button';

const AnalyticsHeader = ({ selectedSemester, setSelectedSemester, semesters, onExport }) => {
    return (
        <div className="relative mb-8 z-20">
            {/* Background with blur */}
            <div className="absolute inset-0 bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-lg border border-dark-border"></div>

            <div className="relative px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Title Section */}
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Command Center</h1>
                    <p className="text-dark-muted text-sm">Real-time insights on student performance and risk factors.</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

                    {/* Semester Filter */}
                    <div className="relative group w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-48 appearance-none hover:border-primary-500/50 transition-colors"
                        >
                            <option value="">All Semesters</option>
                            {semesters.map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Filter size={14} className="text-slate-400" />
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => onExport('pdf')}
                            className="flex-1 sm:flex-none justify-center bg-dark-bg hover:bg-dark-surface border-dark-border text-white shadow-md hover:shadow-lg transition-all"
                        >
                            <Download size={16} className="mr-2" /> Report
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => onExport('csv')}
                            className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                        >
                            Export Data
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsHeader;
