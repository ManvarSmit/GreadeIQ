import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import CSVUploadCard from '../components/ui/CSVUploadCard';
import { counselorAPI, attendanceAPI, academicAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Calendar, FileText, ChevronDown, ChevronUp, UserCheck, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CounselorDataManagement = () => {
    const { success, error } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manual entry form states
    const [selectedStudent, setSelectedStudent] = useState('');
    const [entryType, setEntryType] = useState('attendance'); // 'attendance' or 'marks'

    // Attendance fields
    const [attendanceDate, setAttendanceDate] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');
    const [attendanceSubject, setAttendanceSubject] = useState('');

    // Marks fields
    const [examName, setExamName] = useState('');
    const [subject, setSubject] = useState('');
    const [marksObtained, setMarksObtained] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [semester, setSemester] = useState('');

    useEffect(() => {
        fetchMyStudents();
    }, []);

    const fetchMyStudents = async () => {
        try {
            setLoading(true);
            const response = await counselorAPI.getMyStudents();
            setStudents(response.data || []);
        } catch (err) { // eslint-disable-line no-unused-vars
            error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = (entityType) => {
        setRefreshKey(prev => prev + 1);
        success(`${entityType} uploaded successfully`);
    };

    const resetForm = () => {
        setSelectedStudent('');
        setAttendanceDate('');
        setAttendanceStatus('PRESENT');
        setAttendanceSubject('');
        setExamName('');
        setSubject('');
        setMarksObtained('');
        setTotalMarks('');
        setSemester('');
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStudent) {
            error('Please select a student');
            return;
        }

        try {
            if (entryType === 'attendance') {
                await attendanceAPI.create({
                    studentId: selectedStudent,
                    date: attendanceDate,
                    status: attendanceStatus,
                    subject: attendanceSubject || undefined
                });
                success('Attendance record added successfully');
            } else {
                await academicAPI.createAssessment({
                    studentId: selectedStudent,
                    examName,
                    subject,
                    marksObtained: parseFloat(marksObtained),
                    totalMarks: parseFloat(totalMarks),
                    semester: parseInt(semester)
                });
                success('Assessment record added successfully');
            }

            resetForm();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            error(err.message || `Failed to add ${entryType}`);
        }
    };

    const csvConfigs = [
        {
            title: 'Attendance Records',
            description: 'Upload daily attendance records for your students',
            uploadEndpoint: attendanceAPI.uploadCSV,
            templateUrl: '/sample_data/attendance_sample.csv',
            icon: Calendar,
            onSuccess: () => handleUploadSuccess('Attendance')
        },
        {
            title: 'Assessment Results',
            description: 'Upload exam scores and marks for your students',
            uploadEndpoint: academicAPI.uploadAssessmentsCSV,
            templateUrl: '/sample_data/assessments_sample.csv',
            icon: FileText,
            onSuccess: () => handleUploadSuccess('Assessments')
        }
    ];

    return (
        <PageWrapper
            title="Manage Student Data"
            subtitle={`Update records for your ${students.length} assigned students`}
        >
            <div className="space-y-8 animate-fade-in pb-12">
                {/* Manual Entry Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden border border-indigo-100 shadow-lg">
                        <button
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="flex items-center justify-between w-full text-left p-6 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Manual Data Entry</h3>
                                    <p className="text-sm text-secondary-500">Add individual attendance or exam records</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full transition-transform duration-300 ${showManualEntry ? 'rotate-180 bg-indigo-100/50' : ''}`}>
                                <ChevronDown size={20} className="text-indigo-500" />
                            </div>
                        </button>

                        <AnimatePresence>
                            {showManualEntry && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-indigo-100"
                                >
                                    <div className="p-6 md:p-8">
                                        <form onSubmit={handleManualSubmit} className="space-y-6">
                                            {/* Entry Type Toggle */}
                                            <div className="flex p-1 bg-dark-surface rounded-xl w-full max-w-md mx-auto mb-8">
                                                <button
                                                    type="button"
                                                    onClick={() => setEntryType('attendance')}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${entryType === 'attendance'
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-dark-muted hover:text-dark-muted'
                                                        }`}
                                                >
                                                    <Calendar size={18} />
                                                    Attendance
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEntryType('marks')}
                                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${entryType === 'marks'
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-dark-muted hover:text-dark-muted'
                                                        }`}
                                                >
                                                    <FileText size={18} />
                                                    Marks / Grades
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {/* Student Selection */}
                                                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                                    <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                        Select Student <span className="text-rose-500">*</span>
                                                    </label>
                                                    <select
                                                        value={selectedStudent}
                                                        onChange={(e) => setSelectedStudent(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                        required
                                                    >
                                                        <option value="">-- Choose a student --</option>
                                                        {students.map(student => (
                                                            <option key={student.id} value={student.id}>
                                                                {student.name} ({student.studentId})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Attendance Fields */}
                                                {entryType === 'attendance' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Date <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={attendanceDate}
                                                                onChange={(e) => setAttendanceDate(e.target.value)}
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Status <span className="text-rose-500">*</span>
                                                            </label>
                                                            <select
                                                                value={attendanceStatus}
                                                                onChange={(e) => setAttendanceStatus(e.target.value)}
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            >
                                                                <option value="PRESENT">Present</option>
                                                                <option value="ABSENT">Absent</option>
                                                                <option value="LEAVE">Leave</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Subject (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={attendanceSubject}
                                                                onChange={(e) => setAttendanceSubject(e.target.value)}
                                                                placeholder="e.g., Mathematics"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Marks Fields */}
                                                {entryType === 'marks' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Exam Name <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={examName}
                                                                onChange={(e) => setExamName(e.target.value)}
                                                                placeholder="e.g., Mid-Sem 1"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Subject <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={subject}
                                                                onChange={(e) => setSubject(e.target.value)}
                                                                placeholder="e.g., Mathematics"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Semester <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={semester}
                                                                onChange={(e) => setSemester(e.target.value)}
                                                                placeholder="e.g., 3"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Marks Obtained <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={marksObtained}
                                                                onChange={(e) => setMarksObtained(e.target.value)}
                                                                placeholder="0.00"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-1.5">
                                                                Total Marks <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={totalMarks}
                                                                onChange={(e) => setTotalMarks(e.target.value)}
                                                                placeholder="100.00"
                                                                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                                                required
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex gap-4 pt-4 border-t border-dark-border">
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
                                                    className="px-6 py-2.5 text-dark-muted hover:text-white font-medium rounded-xl hover:bg-dark-bg transition-colors"
                                                >
                                                    Clear Form
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                                                >
                                                    <Check size={18} />
                                                    Submit {entryType === 'attendance' ? 'Attendance' : 'Marks'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>

                {/* CSV Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Bulk Upload</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {csvConfigs.map((config, index) => (
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

                {loading && students.length === 0 && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
                    </div>
                )}

                {!loading && students.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8"
                    >
                        <Card>
                            <div className="text-center py-16">
                                <div className="bg-dark-bg w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCheck size={40} className="text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No Students Assigned</h3>
                                <p className="text-secondary-500">You need students assigned to you before adding data.</p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </div>
        </PageWrapper>
    );
};

export default CounselorDataManagement;
