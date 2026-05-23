import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import CSVUploadCard from '../components/ui/CSVUploadCard';
import { counselorAPI, attendanceAPI, academicAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
    Calendar, 
    FileText, 
    ChevronDown, 
    ChevronUp, 
    UserCheck, 
    Plus, 
    Check, 
    X,
    Search,
    BookOpen,
    Clock,
    AlertCircle,
    Award,
    Target,
    User,
    Percent,
    GraduationCap,
    CheckCircle,
    XCircle
} from 'lucide-react';
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

    const currentStudentObj = students.find(s => s.id === selectedStudent);
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presetSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English Literature', 'Data Structures'];

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
                                                                    {currentStudentObj.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-white text-sm">{currentStudentObj.name}</div>
                                                                    <div className="text-xs text-dark-muted">{currentStudentObj.studentId}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2.5 text-dark-muted text-sm">
                                                                <User size={18} />
                                                                <span>Choose a student...</span>
                                                            </div>
                                                        )}
                                                        <ChevronDown size={18} className={`text-dark-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {isDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                                transition={{ duration: 0.15 }}
                                                                className="absolute z-50 w-full mt-2 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden"
                                                            >
                                                                {/* Search Header */}
                                                                <div className="p-3 border-b border-dark-border bg-dark-bg/50 flex items-center gap-2">
                                                                    <Search size={16} className="text-dark-muted" />
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Search student by name or ID..."
                                                                        value={searchQuery}
                                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
                                                                        className="w-full bg-transparent border-0 outline-none text-white text-sm placeholder-dark-muted p-1"
                                                                    />
                                                                    {searchQuery && (
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                                                                            className="text-dark-muted hover:text-white p-0.5 rounded-full hover:bg-white/10"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Options List */}
                                                                <div className="max-h-60 overflow-y-auto divide-y divide-dark-border/40 scrollbar-thin">
                                                                    {filteredStudents.length > 0 ? (
                                                                        filteredStudents.map(student => {
                                                                            const isSelected = selectedStudent === student.id;
                                                                            return (
                                                                                <div
                                                                                    key={student.id}
                                                                                    onClick={() => {
                                                                                        setSelectedStudent(student.id);
                                                                                        setIsDropdownOpen(false);
                                                                                        setSearchQuery('');
                                                                                    }}
                                                                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                                                        isSelected ? 'bg-indigo-600/10' : 'hover:bg-white/5'
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-indigo-400 font-semibold border border-dark-border text-sm">
                                                                                            {student.name.charAt(0).toUpperCase()}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-sm font-medium text-white">{student.name}</div>
                                                                                            <div className="text-xs text-dark-muted">{student.studentId}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {isSelected && <Check size={16} className="text-indigo-400" />}
                                                                                </div>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <div className="px-4 py-6 text-center text-sm text-dark-muted">
                                                                            No students found matching search
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Selected Student Info Card */}
                                                {currentStudentObj && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="col-span-full p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                                <UserCheck size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white">Active Student Selection</div>
                                                                <p className="text-xs text-dark-muted">Entering records for {currentStudentObj.name} ({currentStudentObj.studentId})</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStudent('')}
                                                            className="p-1.5 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                            title="Clear selection"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </motion.div>
                                                )}

                                                {/* Attendance Fields */}
                                                {entryType === 'attendance' && (
                                                    <>
                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                Date <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                    <Calendar size={18} />
                                                                </div>
                                                                <input
                                                                    type="date"
                                                                    value={attendanceDate}
                                                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                                                    className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="col-span-1 md:col-span-2">
                                                            <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                Subject (Optional)
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                    <BookOpen size={18} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={attendanceSubject}
                                                                    onChange={(e) => setAttendanceSubject(e.target.value)}
                                                                    placeholder="e.g., Mathematics"
                                                                    className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-dark-muted focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {presetSubjects.slice(0, 4).map(sub => (
                                                                    <button
                                                                        key={sub}
                                                                        type="button"
                                                                        onClick={() => setAttendanceSubject(sub)}
                                                                        className="px-2.5 py-1 rounded-lg text-xs bg-dark-bg border border-dark-border text-dark-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                                                    >
                                                                        {sub}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-full">
                                                            <label className="block text-sm font-medium text-dark-muted mb-2.5 tracking-wide">
                                                                Attendance Status <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                {[
                                                                    { value: 'PRESENT', label: 'Present', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', activeColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]', icon: CheckCircle },
                                                                    { value: 'ABSENT', label: 'Absent', color: 'border-rose-500/20 text-rose-400 bg-rose-500/5', activeColor: 'border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]', icon: XCircle },
                                                                    { value: 'LEAVE', label: 'Leave', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', activeColor: 'border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]', icon: Clock }
                                                                ].map(opt => {
                                                                    const Icon = opt.icon;
                                                                    const isSelected = attendanceStatus === opt.value;
                                                                    return (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            onClick={() => setAttendanceStatus(opt.value)}
                                                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                                                                isSelected ? opt.activeColor : `${opt.color} hover:bg-white/5`
                                                                            }`}
                                                                        >
                                                                            <Icon size={20} className={isSelected ? 'scale-110 transition-transform' : ''} />
                                                                            <span>{opt.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Marks Fields */}
                                                {entryType === 'marks' && (
                                                    <>
                                                        <div className="col-span-full">
                                                            <label className="block text-sm font-medium text-dark-muted mb-2.5 tracking-wide">
                                                                Semester <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                                    <button
                                                                        key={sem}
                                                                        type="button"
                                                                        onClick={() => setSemester(sem.toString())}
                                                                        className={`flex-1 min-w-[60px] py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-center ${
                                                                            semester === sem.toString()
                                                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                                                            : 'bg-dark-bg border-dark-border text-dark-muted hover:text-white hover:bg-white/5'
                                                                        }`}
                                                                    >
                                                                        {sem}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                Exam Name <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                    <Award size={18} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={examName}
                                                                    onChange={(e) => setExamName(e.target.value)}
                                                                    placeholder="e.g., Mid-Sem 1"
                                                                    className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-dark-muted focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {['Mid-Sem 1', 'Mid-Sem 2', 'End-Sem', 'Class Test'].map(preset => (
                                                                    <button
                                                                        key={preset}
                                                                        type="button"
                                                                        onClick={() => setExamName(preset)}
                                                                        className="px-2 py-0.5 rounded-md text-xs bg-dark-bg/60 border border-dark-border text-dark-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                                                    >
                                                                        {preset}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                Subject <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                    <BookOpen size={18} />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={subject}
                                                                    onChange={(e) => setSubject(e.target.value)}
                                                                    placeholder="e.g., Mathematics"
                                                                    className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-dark-muted focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {presetSubjects.slice(0, 4).map(preset => (
                                                                    <button
                                                                        key={preset}
                                                                        type="button"
                                                                        onClick={() => setSubject(preset)}
                                                                        className="px-2 py-0.5 rounded-md text-xs bg-dark-bg/60 border border-dark-border text-dark-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
                                                                    >
                                                                        {preset}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 col-span-full lg:col-span-1">
                                                            <div>
                                                                <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                    Marks Obtained <span className="text-rose-500">*</span>
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                        <Target size={18} />
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={marksObtained}
                                                                        onChange={(e) => setMarksObtained(e.target.value)}
                                                                        placeholder="0.00"
                                                                        className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-dark-muted focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-dark-muted mb-2 tracking-wide">
                                                                    Total Marks <span className="text-rose-500">*</span>
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                                                                        <FileText size={18} />
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={totalMarks}
                                                                        onChange={(e) => setTotalMarks(e.target.value)}
                                                                        placeholder="100.00"
                                                                        className="w-full pl-11 pr-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder:text-dark-muted focus:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {marksObtained && totalMarks && parseFloat(totalMarks) > 0 && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="col-span-full bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Percent size={18} className="text-indigo-400" />
                                                                    <span className="text-sm font-semibold text-dark-muted">Percentage Score</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xl font-bold text-indigo-400">
                                                                        {((parseFloat(marksObtained) / parseFloat(totalMarks)) * 100).toFixed(1)}%
                                                                    </span>
                                                                    <span className="text-xs text-dark-muted bg-dark-bg px-2.5 py-1 rounded-lg border border-dark-border">
                                                                        {marksObtained} / {totalMarks}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <div className="flex gap-4 pt-6 border-t border-dark-border">
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
                                                    className="px-6 py-3 text-dark-muted hover:text-white font-medium rounded-xl hover:bg-dark-bg transition-colors text-sm"
                                                >
                                                    Clear Form
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-500/30 flex items-center justify-center gap-2 text-sm"
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
