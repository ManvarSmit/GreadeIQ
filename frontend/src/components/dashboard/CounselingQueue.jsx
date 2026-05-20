import { Calendar, Clock, User, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const CounselingQueue = ({ sessions, onComplete, onCancel }) => {
    if (!sessions || sessions.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center min-h-[300px] border-dashed">
                <div className="text-center">
                    <div className="w-16 h-16 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="text-slate-300" size={32} />
                    </div>
                    <p className="text-dark-muted font-medium">No active sessions in queue</p>
                    <p className="text-xs text-slate-400 mt-1">Enjoy your break!</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className="group relative bg-dark-surface rounded-xl border border-dark-border p-4 shadow-lg hover:shadow-xl hover:border-dark-muted/30 transition-all duration-300 overflow-hidden"
                >
                    {/* Status Indicator Line */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${session.status === 'SCHEDULED' ? 'bg-indigo-500' : 'bg-slate-300'
                        }`}></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">

                        {/* Session Info */}
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-dark-surface flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-dark-muted">
                                    {session.studentName?.charAt(0) || 'S'}
                                </span>
                            </div>

                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    {session.studentName}
                                    <Badge variant={session.dropoutRisk === 'HIGH' ? 'danger' : 'neutral'} size="sm">
                                        {session.dropoutRisk} RISK
                                    </Badge>
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-dark-muted mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(session.date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {session.time || '10:00 AM'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCancel(session.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                title="Cancel Session"
                            >
                                <XCircle size={18} />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(`/students/${session.studentId}`, '_blank')} // Open profile
                                className="text-dark-muted"
                            >
                                Profile
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onComplete(session.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                            >
                                <CheckCircle size={16} /> Complete
                            </Button>
                        </div>
                    </div>

                    {/* Notes Preview (if any) */}
                    {session.notes && (
                        <div className="mt-3 pl-14 text-sm text-dark-muted italic border-l-2 border-dark-border pl-3">
                            "{session.notes}"
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CounselingQueue;
