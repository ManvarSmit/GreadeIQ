import { useState } from 'react';
import { X, MessageSquare, CheckCircle2, Calendar, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { counselingAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const LogCounselingModal = ({ isOpen, onClose, studentId, studentName, onSuccess }) => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    sessionDate: getTodayLocalDateStr(),
    sessionTime: '02:00 PM',
    notes: '',
    actionsTaken: '',
    followUpRequired: false,
    followUpDate: ''
  });

  if (!isOpen) return null;

  const parseLocalDateTime = (dateStr, timeStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    let hours = 14;
    let minutes = 0;
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const isPM = match[3].toUpperCase() === 'PM';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }
    }
    return new Date(year, month - 1, day, hours, minutes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.notes.trim()) {
      toastError('Session notes are required');
      return;
    }

    try {
      setLoading(true);
      const sessionDateObj = parseLocalDateTime(formData.sessionDate, formData.sessionTime);

      await counselingAPI.createLog({
        studentId,
        sessionDate: sessionDateObj.toISOString(),
        notes: formData.notes,
        actionsTaken: formData.actionsTaken,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
      });

      success('Counseling meeting logged successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Log counseling error:', err);
      toastError(err.message || 'Failed to log counseling meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Log Counseling Meeting</h3>
              <p className="text-xs text-dark-muted">Recording session details for <span className="text-white font-medium">{studentName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Meeting Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2 flex items-center gap-1">
                <Calendar size={14} /> Meeting Date
              </label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2 flex items-center gap-1">
                <Clock size={14} /> Meeting Time
              </label>
              <select
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="05:30 PM">05:30 PM</option>
              </select>
            </div>
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
              Session Discussion Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detail issues discussed (academic struggles, attendance reasons, stress factors...)"
              className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions Taken */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-2">
              Action Plan / Recommendations
            </label>
            <input
              type="text"
              value={formData.actionsTaken}
              onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
              placeholder="e.g. Remedial classes assigned, Weekly progress check scheduled"
              className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Follow-up Required Toggle */}
          <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-dark-border bg-dark-bg"
              />
              <span className="text-sm font-medium text-white">Follow-Up Meeting Required?</span>
            </label>

            {formData.followUpRequired && (
              <div className="pt-2 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-muted mb-1 flex items-center gap-1">
                  <Calendar size={14} /> Follow-Up Date
                </label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="text-dark-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Saving...' : 'Save Counseling Meeting'}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default LogCounselingModal;
