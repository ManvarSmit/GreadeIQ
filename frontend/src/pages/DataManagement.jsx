import { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import CSVUploadCard from '../components/ui/CSVUploadCard';
import AddStudentModal from '../components/modals/AddStudentModal';
import { studentAPI, attendanceAPI, academicAPI, feeAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Users, Calendar, FileText, BookOpen, DollarSign, AlertTriangle, Trash2, ChevronDown, ChevronUp, Database, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataManagement = () => {
  const { success, error, info } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleUploadSuccess = (entityType) => {
    // Trigger data refresh
    setRefreshKey(prev => prev + 1);
    success(`${entityType} uploaded successfully`);
  };

  const handleClearAllData = async () => {
    if (confirmText !== 'DELETE') {
      setClearError('Please type DELETE to confirm');
      return;
    }

    try {
      setClearing(true);
      setClearError('');

      const result = await studentAPI.clearAllData();

      // Success - close modal and refresh
      setShowClearModal(false);
      setConfirmText('');
      setRefreshKey(prev => prev + 1);

      success(`Successfully deleted ${result.data.totalRecords} records!`);
      info('You can now upload new data.');
    } catch (err) {
      setClearError(err.message || 'Failed to clear data. Please try again.');
      error('Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  // Master CSV - Primary Upload Option
  const masterConfig = {
    title: 'Master Student Data',
    description: 'Upload ALL student data in one file: personal info, academics, attendance %, behavioral data, family info, and fees',
    uploadEndpoint: studentAPI.uploadCSV,
    templateUrl: '/sample_data/master_students_sample.csv',
    icon: Database,
    onSuccess: () => handleUploadSuccess('Master Data')
  };

  // Detailed CSVs - Optional for institutions needing historical data
  const detailedConfigs = [
    {
      title: 'Students (Basic)',
      description: 'Upload basic student information only (use Master CSV for complete data)',
      uploadEndpoint: studentAPI.uploadCSV,
      templateUrl: '/sample_data/students_sample.csv',
      icon: Users,
      onSuccess: () => handleUploadSuccess('Students')
    },
    {
      title: 'Attendance Records',
      description: 'Upload daily attendance records - enables trend analysis over time',
      uploadEndpoint: attendanceAPI.uploadCSV,
      templateUrl: '/sample_data/attendance_sample.csv',
      icon: Calendar,
      onSuccess: () => handleUploadSuccess('Attendance')
    },
    {
      title: 'Assessment Results',
      description: 'Upload individual exam scores - enables performance drop detection',
      uploadEndpoint: academicAPI.uploadAssessmentsCSV,
      templateUrl: '/sample_data/assessments_sample.csv',
      icon: FileText,
      onSuccess: () => handleUploadSuccess('Assessments')
    },
    {
      title: 'Course Attempts',
      description: 'Upload course attempt history with pass/fail status',
      uploadEndpoint: academicAPI.uploadAttemptsCSV,
      templateUrl: '/sample_data/attempts_sample.csv',
      icon: BookOpen,
      onSuccess: () => handleUploadSuccess('Course Attempts')
    },
    {
      title: 'Fee Records',
      description: 'Upload fee payment information separately (already included in Master CSV)',
      uploadEndpoint: feeAPI.uploadCSV,
      templateUrl: '/sample_data/fees_sample.csv',
      icon: DollarSign,
      onSuccess: () => handleUploadSuccess('Fees')
    }
  ];

  return (
    <PageWrapper
      title="Data Management"
      subtitle="Upload and manage institutional data"
    >
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Master Data Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="text-indigo-600" size={24} />
              Core Data Upload
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-indigo-500/30"
            >
              <UserPlus size={18} />
              Add Single Student
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CSVUploadCard
              key={`master-${refreshKey}`}
              title={masterConfig.title}
              description={masterConfig.description}
              uploadEndpoint={masterConfig.uploadEndpoint}
              templateUrl={masterConfig.templateUrl}
              icon={masterConfig.icon}
              onUploadSuccess={masterConfig.onSuccess}
            />
          </motion.div>
        </section>

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setRefreshKey(prev => prev + 1);
          }}
        />

        {/* Advanced Section */}
        <section className="bg-dark-surface/80 backdrop-blur-md rounded-2xl border border-dark-border/60 p-6 transition-all hover:border-dark-border">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-3 w-full text-left group"
          >
            <div className={`p-2 rounded-lg transition-colors ${showAdvanced ? 'bg-indigo-600/20 text-indigo-400' : 'bg-dark-bg text-dark-muted group-hover:bg-dark-surface/80 group-hover:text-white'}`}>
              {showAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">Advanced Data Options</h3>
              <p className="text-sm text-dark-muted">Upload specific datasets individually (Attendance, Exams, Fees)</p>
            </div>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {detailedConfigs.map((config, index) => (
                    <CSVUploadCard
                      key={`${config.title}-${refreshKey}-${index}`}
                      title={config.title}
                      description={config.description}
                      uploadEndpoint={config.uploadEndpoint}
                      templateUrl={config.templateUrl}
                      icon={config.icon}
                      onUploadSuccess={config.onSuccess}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Danger Zone */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.05)]"
        >
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-400">Danger Zone</h3>
                <p className="text-sm text-dark-muted max-w-xl">
                  Permanently delete all system data including students, academic records, and attendance. This action cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowClearModal(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md hover:shadow-rose-500/20 flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 size={18} />
              Reset System Data
            </button>
          </div>
        </motion.section>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showClearModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setShowClearModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-dark-surface rounded-2xl border border-dark-border shadow-2xl max-w-md w-full p-0 overflow-hidden z-10"
              >
                <div className="p-6 bg-rose-950/20 border-b border-dark-border flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-full">
                    <AlertTriangle className="text-rose-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-rose-400">Confirm Data Deletion</h3>
                </div>

                <div className="p-6">
                  <div className="mb-6 p-4 bg-rose-950/15 border border-rose-500/20 rounded-xl">
                    <p className="text-sm text-rose-400 font-semibold mb-2">⚠️ This will permanently delete:</p>
                    <ul className="text-sm text-dark-muted space-y-1 ml-4 list-disc">
                      <li>All student records & profiles</li>
                      <li>Academic history & attendance logs</li>
                      <li>Behavioral incidents & counseling notes</li>
                      <li>Fee & payment records</li>
                    </ul>
                  </div>

                  <label className="block text-sm text-dark-muted mb-2">
                    Type <span className="font-mono font-bold text-white">DELETE</span> to confirm:
                  </label>

                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono placeholder:text-dark-muted"
                  />

                  {clearError && (
                    <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20">
                      {clearError}
                    </div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => {
                        setShowClearModal(false);
                        setConfirmText('');
                        setClearError('');
                      }}
                      disabled={clearing}
                      className="flex-1 px-4 py-2.5 bg-dark-bg hover:bg-dark-bg/70 text-dark-muted hover:text-white font-semibold rounded-xl border border-dark-border transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAllData}
                      disabled={confirmText !== 'DELETE' || clearing}
                      className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-rose-500/25"
                    >
                      {clearing ? 'Deleting...' : 'Delete Everything'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default DataManagement;
