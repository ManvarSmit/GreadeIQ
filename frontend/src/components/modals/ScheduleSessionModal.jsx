import { useState } from 'react';
import { X, Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

const ScheduleSessionModal = ({ isOpen, onClose, students = [], defaultStudentId = null, onSchedule }) => {
  const { success, error: toastError } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId || (students[0]?.id || ''));
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState('02:00 PM');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetStudent = students.find(s => s.id === selectedStudentId) || {
      id: selectedStudentId,
      name: 'Student',
      dropoutRisk: 'MEDIUM'
    };

    if (!selectedStudentId) {
      toastError('Please select a student');
      return;
    }

    const newSession = {
      id: `scheduled_${Date.now()}`,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      dropoutRisk: targetStudent.dropoutRisk || 'MEDIUM',
      date: sessionDate,
      time: sessionTime,
      status: 'SCHEDULED',
      notes: notes
    };

    if (onSchedule) {
      onSchedule(newSession);
    }
    success(`Session scheduled for ${targetStudent.name}! Added to Counseling Queue.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Schedule Counseling Meeting</h3>
              <p className="text-xs text-dark-muted">Add a pending meeting to your Counseling Queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Select Student */}
          {!defaultStudentId ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
                Select Student <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-dark-surface text-white">
                    {s.name} ({s.studentId}) — [{s.dropoutRisk} RISK]
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
                Meeting Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
                Meeting Time
              </label>
              <select
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="04:30 PM">04:30 PM</option>
              </select>
            </div>
          </div>

          {/* Purpose / Agenda */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
              Session Agenda / Purpose
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discuss low attendance in CS101, review mid-term marks"
              className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-dark-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <CheckCircle2 size={16} /> Schedule Session
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ScheduleSessionModal;
