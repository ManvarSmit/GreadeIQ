import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import CSVUploadCard from '../components/ui/CSVUploadCard';
import { mentorAPI, attendanceAPI, academicAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
    Calendar, 
    FileText, 
    ChevronDown, 
    UserCheck, 
    Plus, 
    Check, 
    X,
    Search,
    BookOpen,
    Clock,
    Award,
    Target,
    User,
    GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AcademicDataManagement = () => {
    const { success, error } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manual entry form states
    const [selectedStudent, setSelectedStudent] = useState('');
    const [entryType, setEntryType] = useState('attendance'); // 'attendance' or 'marks'

    // Dropdown and search states
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdown = document.getElementById('student-dropdown-container');
            if (dropdown && !dropdown.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const fetchMyStudents = async () => {
        try {
            setLoading(true);
            const response = await mentorAPI.getMyStudents();
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
                await mentorAPI.updateStudentAttendance(selectedStudent, {
                    date: attendanceDate,
                    status: attendanceStatus,
                    subject: attendanceSubject || undefined
                });
                success('Attendance record added successfully');
            } else {
                await mentorAPI.updateStudentMarks(selectedStudent, {
                    subject,
                    examType: examName,
                    marksObtained: parseFloat(marksObtained),
                    totalMarks: parseFloat(totalMarks),
                    date: new Date()
                });
                success('Assessment record added successfully');
            }

            resetForm();
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            error(err.response?.data?.message || err.message || `Failed to add ${entryType}`);
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

    const currentStudentObj = students.find(s => s.id === selectedStudent);
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presetSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English Literature', 'Data Structures'];

    return (
        <PageWrapper
            title="Manage Academic Data"
            subtitle={`Update records for your ${students.length} assigned students`}
        >
            <div className="space-y-8 animate-fade-in pb-12">
                {/* Manual Entry Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden border border-dark-border shadow-lg">
                        <button
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="flex items-center justify-between w-full text-left p-6 bg-dark-surface hover:bg-dark-surface/90 transition-colors"
                            type="button"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                                    <Plus size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Manual Data Entry</h3>
                                    <p className="text-sm text-dark-muted">Add individual attendance or exam records</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-full transition-transform duration-300 ${showManualEntry ? 'rotate-180 bg-indigo-500/10 text-indigo-400' : 'text-dark-muted'}`}>
                                <ChevronDown size={20} />
                            </div>
                        </button>

                        <AnimatePresence>
                            {showManualEntry && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-dark-border bg-dark-surface/20"
                                >
                                    <div className="p-6 md:p-8">
                                        <form onSubmit={handleManualSubmit} className="space-y-8">
                                            {/* Entry Type Toggle */}
                                            <div className="flex p-1 bg-dark-bg border border-dark-border rounded-xl w-full max-w-md mx-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setEntryType('attendance')}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${entryType === 'attendance'
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                        : 'text-dark-muted hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <Calendar size={18} />
                                                    Attendance
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEntryType('marks')}
                                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${entryType === 'marks'
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                        : 'text-dark-muted hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    <FileText size={18} />
                                                    Marks / Grades
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {/* Student Selection Custom Dropdown */}
                                                <div className="col-span-full relative" id="student-dropdown-container">
                                                    <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                        Select Student <span className="text-rose-500">*</span>
                                                    </label>
                                                    
                                                    <div 
                                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                        className={`w-full px-4 py-3 bg-dark-bg border rounded-xl text-white flex items-center justify-between cursor-pointer transition-all ${
                                                            isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-dark-surface' : 'border-dark-border hover:border-dark-muted'
                                                        }`}
                                                    >
                                                        {currentStudentObj ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                                    {currentStudentObj.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white">{currentStudentObj.name}</div>
                                                                    <div className="text-xs text-dark-muted font-mono">{currentStudentObj.studentId} • {currentStudentObj.department}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-dark-muted">
                                                                <User size={18} />
                                                                <span>Select a student to update</span>
                                                            </div>
                                                        )}
                                                        <ChevronDown size={18} className={`text-dark-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                                                    </div>

                                                    {/* Dropdown Menu */}
                                                    <AnimatePresence>
                                                        {isDropdownOpen && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute z-50 left-0 right-0 mt-2 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                                                            >
                                                                <div className="p-3 border-b border-dark-border bg-dark-bg/50">
                                                                    <div className="relative">
                                                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Search by name or ID..."
                                                                            value={searchQuery}
                                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                                                                            autoFocus
                                                                        />
                                                                        {searchQuery && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="max-h-60 overflow-y-auto divide-y divide-dark-border/40">
                                                                    {filteredStudents.length > 0 ? (
                                                                        filteredStudents.map((s) => (
                                                                            <div
                                                                                key={s.id}
                                                                                onClick={() => {
                                                                                    setSelectedStudent(s.id);
                                                                                    setIsDropdownOpen(false);
                                                                                }}
                                                                                className={`p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${
                                                                                    selectedStudent === s.id ? 'bg-indigo-500/10' : ''
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-dark-muted font-bold text-xs">
                                                                                        {s.name.charAt(0)}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-medium text-white">{s.name}</p>
                                                                                        <p className="text-xs text-dark-muted font-mono">{s.studentId}</p>
                                                                                    </div>
                                                                                </div>
                                                                                {selectedStudent === s.id && (
                                                                                    <Check size={16} className="text-indigo-400" />
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="p-4 text-center text-sm text-dark-muted">
                                                                            No students match "{searchQuery}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {entryType === 'attendance' ? (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Date <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="date"
                                                                    value={attendanceDate}
                                                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Attendance Status <span className="text-rose-500">*</span>
                                                            </label>
                                                            <select
                                                                value={attendanceStatus}
                                                                onChange={(e) => setAttendanceStatus(e.target.value)}
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                            >
                                                                <option value="PRESENT">Present</option>
                                                                <option value="ABSENT">Absent</option>
                                                                <option value="LATE">Late</option>
                                                                <option value="EXCUSED">Excused</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Subject (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={attendanceSubject}
                                                                onChange={(e) => setAttendanceSubject(e.target.value)}
                                                                placeholder="e.g., Data Structures"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Exam / Assessment Type <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={examName}
                                                                onChange={(e) => setExamName(e.target.value)}
                                                                placeholder="e.g., Mid-Term 1, Quiz 2"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Subject <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={subject}
                                                                onChange={(e) => setSubject(e.target.value)}
                                                                placeholder="e.g., Computer Networks"
                                                                list="preset-subjects"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                required
                                                            />
                                                            <datalist id="preset-subjects">
                                                                {presetSubjects.map((sub, i) => (
                                                                    <option key={i} value={sub} />
                                                                ))}
                                                            </datalist>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Marks Obtained <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={marksObtained}
                                                                onChange={(e) => setMarksObtained(e.target.value)}
                                                                placeholder="e.g., 42.5"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Total Marks <span className="text-rose-500">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={totalMarks}
                                                                onChange={(e) => setTotalMarks(e.target.value)}
                                                                placeholder="e.g., 50"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2">
                                                                Semester
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={semester}
                                                                onChange={(e) => setSemester(e.target.value)}
                                                                placeholder="e.g., 4"
                                                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
                                                    className="px-5 py-2.5 rounded-xl border border-dark-border text-dark-muted hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                                                >
                                                    Clear Fields
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
                                                >
                                                    Record {entryType === 'attendance' ? 'Attendance' : 'Marks'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>

                {/* Bulk CSV Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bulk Data Upload</h3>
                            <p className="text-sm text-dark-muted">Import multiple records via standard CSV sheets</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {csvConfigs.map((config, index) => (
                            <CSVUploadCard
                                key={`${config.title}-${refreshKey}`}
                                title={config.title}
                                description={config.description}
                                uploadEndpoint={config.uploadEndpoint}
                                templateUrl={config.templateUrl}
                                icon={config.icon}
                                onSuccess={config.onSuccess}
                                index={index}
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

export default AcademicDataManagement;
