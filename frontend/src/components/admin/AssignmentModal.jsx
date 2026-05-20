import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, UserPlus, UserCog, Filter, Users, Search, Check } from 'lucide-react';
import Button from '../ui/Button';
import AIAssignment from './AIAssignment';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AssignmentModal = ({
    isOpen,
    onClose,
    onAssignSuccess,
    initialType = 'student-counselor',
    counselors = [],
    mentors = [],
    students = []
}) => {
    const { success, error } = useToast();

    const [assignmentType, setAssignmentType] = useState(initialType);
    const [selectedCounselor, setSelectedCounselor] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Advanced filters
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [assignmentMode, setAssignmentMode] = useState('manual');
    const [rangeStart, setRangeStart] = useState(1);
    const [rangeEnd, setRangeEnd] = useState(10);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAssignmentType(initialType);
            setSelectedCounselor('');
            setSelectedStudents([]);
            setSelectedMentor('');
            setSearchTerm('');
            setFilterDepartment('');
            setFilterSemester('');
            setAssignmentMode('manual');
            setRangeStart(1);
            setRangeEnd(10);
        }
    }, [isOpen, initialType]);

    if (!isOpen) return null;

    // Helper functions
    const getAvailableStudents = () => {
        const assignedStudentIds = new Set();
        counselors.forEach(counselor => {
            if (counselor.assignedStudents) {
                counselor.assignedStudents.forEach(assignment => {
                    assignedStudentIds.add(assignment.studentId);
                });
            }
        });

        let available = students.filter(student => !assignedStudentIds.has(student.id));

        if (filterDepartment) {
            available = available.filter(student =>
                student.department && student.department === filterDepartment
            );
        }

        if (filterSemester) {
            available = available.filter(student =>
                student.semester && student.semester === parseInt(filterSemester)
            );
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            available = available.filter(student =>
                (student.name && student.name.toLowerCase().includes(term)) ||
                (student.studentId && student.studentId.toLowerCase().includes(term))
            );
        }

        return available;
    };

    const getUniqueDepartments = () => {
        const depts = [...new Set(students.map(s => s.department))];
        return depts.filter(d => d).sort();
    };

    const getUniqueSemesters = () => {
        const sems = [...new Set(students.map(s => s.semester))];
        return sems.filter(s => s && !isNaN(s)).sort((a, b) => a - b);
    };

    const handleRangeSelection = () => {
        const available = getAvailableStudents();
        const start = Math.max(1, rangeStart) - 1;
        const end = Math.min(rangeEnd, available.length);
        const selectedIds = available.slice(start, end).map(s => s.id);
        setSelectedStudents(selectedIds);
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleAssignStudents = async () => {
        try {
            if (selectedStudents.length === 0 || !selectedCounselor) {
                error('Please select counselor and at least one student');
                return;
            }

            if (selectedStudents.length === 1) {
                await adminAPI.assignStudentToCounselor({
                    studentId: selectedStudents[0],
                    counselorId: selectedCounselor
                });
            } else {
                await adminAPI.bulkAssignStudents({
                    studentIds: selectedStudents,
                    counselorId: selectedCounselor
                });
            }

            success(`Successfully assigned ${selectedStudents.length} student(s)`);
            onAssignSuccess();
            onClose();
        } catch (err) {
            error(err.message || 'Failed to assign students');
        }
    };

    const handleAssignMentor = async () => {
        try {
            if (!selectedMentor || !selectedCounselor) {
                error('Please select both mentor and counselor');
                return;
            }

            await adminAPI.assignMentorToCounselor({
                mentorId: selectedMentor,
                counselorId: selectedCounselor
            });

            success('Successfully assigned mentor to counselor');
            onAssignSuccess();
            onClose();
        } catch (err) {
            error(err.message || 'Failed to assign mentor');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-dark-surface border border-dark-border rounded-2xl shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-dark-border">
                        <h3 className="text-xl font-bold text-white">
                            {assignmentType === 'student-counselor' ? 'Assign Students to Counselor' : 'Assign Mentor to Counselor'}
                        </h3>
                        <div className="flex bg-dark-surface p-1 rounded-lg mr-4">
                            <button
                                onClick={() => setAssignmentType('student-counselor')}
                                className={`p-1.5 rounded-md transition-all ${assignmentType === 'student-counselor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-dark-muted'}`}
                                title="Assign Students"
                            >
                                <UserPlus size={18} />
                            </button>
                            <button
                                onClick={() => setAssignmentType('mentor-counselor')}
                                className={`p-1.5 rounded-md transition-all ${assignmentType === 'mentor-counselor' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400 hover:text-dark-muted'}`}
                                title="Assign Mentor"
                            >
                                <UserCog size={18} />
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-dark-muted hover:bg-dark-surface rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Select Counselor */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark-muted">Select Counselor</label>
                            <div className="relative">
                                <select
                                    value={selectedCounselor}
                                    onChange={(e) => setSelectedCounselor(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white transition-shadow appearance-none outline-none shadow-sm"
                                >
                                    <option value="">Choose a counselor...</option>
                                    {counselors.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.studentCount}/{c.maxStudents} students)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight className="rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        {assignmentType === 'student-counselor' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-dark-muted">
                                        Select Students <span className="text-indigo-600 ml-1">({selectedStudents.length} selected)</span>
                                    </label>
                                    <div className="flex bg-dark-surface p-1 rounded-lg">
                                        <button
                                            onClick={() => setAssignmentMode('manual')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${assignmentMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-dark-muted hover:text-dark-muted'
                                                }`}
                                        >
                                            Manual
                                        </button>
                                        <button
                                            onClick={() => setAssignmentMode('range')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${assignmentMode === 'range' ? 'bg-white text-indigo-600 shadow-sm' : 'text-dark-muted hover:text-dark-muted'
                                                }`}
                                        >
                                            Range
                                        </button>
                                    </div>
                                </div>

                                {/* AI Assignment for Single Student */}
                                {assignmentType === 'student-counselor' && selectedStudents.length === 1 && (
                                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                        <AIAssignment
                                            studentId={selectedStudents[0]}
                                            studentName={getAvailableStudents().find(s => s.id === selectedStudents[0])?.name}
                                            onMentorSelect={(mentorId) => {
                                                setSelectedMentor(mentorId);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Filters */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <select
                                            value={filterDepartment}
                                            onChange={(e) => setFilterDepartment(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 appearance-none outline-none"
                                        >
                                            <option value="">All Departments</option>
                                            {getUniqueDepartments().map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={filterSemester}
                                            onChange={(e) => setFilterSemester(e.target.value)}
                                            className="w-full px-4 py-2 text-sm bg-dark-bg border border-dark-border rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 appearance-none outline-none"
                                        >
                                            <option value="">All Semesters</option>
                                            {getUniqueSemesters().map(sem => (
                                                <option key={sem} value={sem}>Semester {sem}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {assignmentMode === 'range' ? (
                                    <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-4">
                                        <p className="text-sm font-medium text-dark-muted flex items-center gap-2">
                                            <Users size={16} className="text-indigo-600" />
                                            {getAvailableStudents().length} available students match filters
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-dark-muted mb-1">Start Index</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={getAvailableStudents().length}
                                                    value={rangeStart}
                                                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 border border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-dark-muted mb-1">End Index</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={getAvailableStudents().length}
                                                    value={rangeEnd}
                                                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 border border-dark-border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleRangeSelection}
                                            variant="primary"
                                            className="w-full justify-center"
                                        >
                                            Select Range
                                        </Button>

                                        {selectedStudents.length > 0 && (
                                            <div className="border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
                                                <div className="px-3 py-2 bg-dark-bg border-b border-dark-border">
                                                    <p className="text-xs font-semibold text-dark-muted uppercase">Selection Preview</p>
                                                </div>
                                                <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                                                    {getAvailableStudents()
                                                        .filter(s => selectedStudents.includes(s.id))
                                                        .map(student => (
                                                            <div key={student.id} className="text-sm text-dark-muted px-2 py-1 rounded hover:bg-dark-bg flex justify-between">
                                                                <span>{student.name}</span>
                                                                <span className="text-slate-400 text-xs">{student.studentId}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search students..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-dark-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-bg/50 h-64 flex flex-col">
                                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                                {getAvailableStudents().length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                        <Search size={24} className="mb-2 opacity-50" />
                                                        <p className="text-sm">No students found</p>
                                                    </div>
                                                ) : (
                                                    getAvailableStudents().map(student => (
                                                        <motion.div
                                                            key={student.id}
                                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.8)' }}
                                                            whileTap={{ scale: 0.99 }}
                                                            onClick={() => toggleStudentSelection(student.id)}
                                                            className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between group ${selectedStudents.includes(student.id)
                                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                                : 'bg-white border-transparent hover:border-dark-border hover:shadow-sm'
                                                                }`}
                                                        >
                                                            <div>
                                                                <p className={`text-sm font-medium ${selectedStudents.includes(student.id) ? 'text-indigo-900' : 'text-dark-muted'}`}>
                                                                    {student.name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-xs text-dark-muted">{student.studentId}</p>
                                                                    <span className="text-slate-300">•</span>
                                                                    <p className="text-xs text-dark-muted">{student.department}</p>
                                                                </div>
                                                            </div>
                                                            {selectedStudents.includes(student.id) && (
                                                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                                                    <Check size={14} className="text-white" />
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-dark-muted">Select Mentor</label>
                                <div className="relative">
                                    <select
                                        value={selectedMentor}
                                        onChange={(e) => setSelectedMentor(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none outline-none shadow-sm"
                                    >
                                        <option value="">Choose a mentor...</option>
                                        {mentors.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronRight className="rotate-90" size={16} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-dark-border bg-dark-bg flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={assignmentType === 'student-counselor' ? handleAssignStudents : handleAssignMentor}
                            className="px-6"
                        >
                            Confirm Assignment
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AssignmentModal;
