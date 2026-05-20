import { useNavigate } from 'react-router-dom';
import { Mail, Phone, BookOpen, AlertTriangle, MoreVertical, Eye, Users } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const TrendIndicator = ({ value, label }) => (
    <div className="flex flex-col">
        <span className="text-xs text-dark-muted font-medium uppercase tracking-wider">{label}</span>
        <span className={`text-xl font-bold ${value < 75 ? 'text-danger-400' : 'text-white'}`}>
            {value}%
        </span>
    </div>
);

const MenteeCard = ({ student }) => {
    const navigate = useNavigate();
    return (
        <div className="group bg-dark-surface rounded-2xl border border-dark-border p-5 shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-primary-500/50 transition-all duration-300 relative overflow-hidden">
            {/* Risk Border Top */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${student.dropoutRisk === 'HIGH' ? 'bg-danger-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                    student.dropoutRisk === 'MEDIUM' ? 'bg-warning-500' : 'bg-success-500'
                }`}></div>

            <div className="flex justify-between items-start mb-4 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-dark-bg flex items-center justify-center text-lg font-bold text-dark-muted border border-white/5 group-hover:bg-primary-500/10 group-hover:text-primary-400 group-hover:border-primary-500/30 transition-all">
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors tracking-wide">{student.name}</h3>
                        <p className="text-xs text-dark-muted font-mono">{student.studentId}</p>
                    </div>
                </div>
                <div className="p-2 hover:bg-white/5 rounded-full cursor-pointer text-dark-muted transition-colors">
                    <MoreVertical size={18} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-5 border-t border-b border-dark-border py-4">
                <TrendIndicator value={student.attendancePercent ? Math.round(student.attendancePercent) : 0} label="Attendance" />
                <div className="flex flex-col text-right">
                    <span className="text-xs text-dark-muted font-medium uppercase tracking-wider">CGPA</span>
                    <span className={`text-xl font-bold ${student.currentCGPA < 6 ? 'text-danger-400' : 'text-white'}`}>
                        {student.currentCGPA?.toFixed(1) || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center border-dark-border text-dark-muted hover:text-white hover:border-primary-500 hover:bg-primary-500/10"
                    onClick={() => navigate(`/students/${student.id}`)}
                >
                    <Eye size={16} className="mr-2" /> Profile
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className={`px-4 bg-dark-bg border border-dark-border text-dark-muted hover:text-white ${student.dropoutRisk === 'HIGH' ? 'hover:text-danger-400 hover:border-danger-500/50 hover:bg-danger-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'hover:border-primary-500/50 hover:bg-primary-500/10'}`}
                    onClick={() => navigate(`/students/${student.id}`)}
                    title="View risk and profile"
                >
                    <AlertTriangle size={16} />
                </Button>
            </div>

            {/* Risk Indicator Tag (if high risk) */}
            {student.dropoutRisk === 'HIGH' && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-danger-500/10 text-danger-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-danger-500/20">
                    <div className="w-1.5 h-1.5 bg-danger-400 rounded-full animate-pulse"></div>
                    CRITICAL
                </div>
            )}
        </div>
    );
};

const MyMenteesGrid = ({ students }) => {
    if (!students || students.length === 0) {
        return (
            <div className="text-center py-16 bg-dark-surface/50 border border-dark-border rounded-2xl glass-panel">
                <div className="w-20 h-20 bg-dark-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
                    <Users size={32} className="text-dark-muted" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">No Mentees Assigned</h3>
                <p className="text-dark-muted text-sm mt-2 max-w-sm mx-auto">Students assigned to you will appear here along with AI-driven insights and risk alerts.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
                <MenteeCard key={student.id} student={student} />
            ))}
        </div>
    );
};

export default MyMenteesGrid;
