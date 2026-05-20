import { UserPlus, Bot, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const MentorshipCard = ({ student, onAssign, assigning }) => {
    const mentor = student.mentorAssignment?.[0]?.mentor;

    return (
        <Card className="h-full border-none shadow-md shadow-indigo-100 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <ShieldCheck size={20} />
                </div>
                <h3 className="font-bold text-white">Mentorship Status</h3>
            </div>

            {mentor ? (
                <div className="bg-white p-4 rounded-xl border border-dark-border shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full translate-x-10 -translate-y-10"></div>

                    <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Assigned Mentor</p>
                        <h4 className="text-lg font-bold text-indigo-900">{mentor.name}</h4>
                        <p className="text-sm text-dark-muted">{mentor.specialization || 'General Mentor'}</p>

                        <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
                            <span className="text-xs text-slate-400">Assigned {student.mentorAssignment[0].assignedAt ? new Date(student.mentorAssignment[0].assignedAt).toLocaleDateString() : 'Recently'}</span>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View Schedule</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="text-slate-400" size={24} />
                    </div>
                    <p className="text-dark-muted text-sm mb-4">No mentor assigned yet.</p>

                    <Button
                        onClick={onAssign}
                        disabled={assigning}
                        className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {assigning ? (
                            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Assigning...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Bot size={16} /> Auto-Assign Mentor</span>
                        )}
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default MentorshipCard;
