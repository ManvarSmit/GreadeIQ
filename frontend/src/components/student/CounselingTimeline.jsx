import { Clock, Calendar, MessageSquarePlus } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const CounselingTimeline = ({ history }) => {
    const safeHistory = Array.isArray(history) ? history : [];

    const formatDateSafe = (dateVal) => {
        if (!dateVal) return new Date().toLocaleDateString();
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return new Date().toLocaleDateString();
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return new Date().toLocaleDateString();
        }
    };

    return (
        <Card className="h-full border-none shadow-md shadow-slate-200/50">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Counseling & Intervention History</h3>
                        <p className="text-xs text-dark-muted">Timeline of completed meetings, notes, and academic guidance ({safeHistory.length} recorded)</p>
                    </div>
                </div>
            </div>

            <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-dark-surface">
                {safeHistory.length > 0 ? (
                    safeHistory.map((session, index) => (
                        <div key={session.id || index} className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-dark-bg bg-indigo-500 shadow-sm -ml-[5px]"></div>

                            <div className="mb-1 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-dark-muted uppercase flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatDateSafe(session.sessionDate || session.date || session.createdAt)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-xs font-semibold text-indigo-300">
                                    {session.counselorName || session.mentorName || 'Counselor Session'}
                                </span>
                                {session.actionsTaken && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-xs font-semibold text-emerald-300">
                                        Action Plan Set
                                    </span>
                                )}
                            </div>

                            <div className="bg-dark-bg p-4 rounded-xl border border-dark-border hover:border-indigo-500/30 transition-colors space-y-2">
                                <p className="text-sm text-white leading-relaxed">{session.notes || session.summary || 'Session completed'}</p>
                                {session.actionsTaken && (
                                    <div className="text-xs text-indigo-300 pt-2 border-t border-dark-border/60 font-medium">
                                        📌 <span className="font-semibold text-indigo-200">Action Taken:</span> {session.actionsTaken}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 pl-6 space-y-3">
                        <p className="text-dark-muted italic text-sm">No completed counseling sessions recorded for this student yet.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CounselingTimeline;
