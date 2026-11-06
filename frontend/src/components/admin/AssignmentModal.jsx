import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, UserPlus, Filter, Users, Search, Check } from 'lucide-react';
import Button from '../ui/Button';
import AIAssignment from './AIAssignment';
import { adminAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AssignmentModal = ({
    isOpen,
    onClose,
    onAssignSuccess,
    mentors = [],
    students = []
}) => {
    const { success, error } = useToast();

    const [selectedMentor, setSelectedMentor] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
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
            setSelectedMentor('');
            setSelectedStudents([]);
            setSearchTerm('');
            setFilterDepartment('');
            setFilterSemester('');
            setAssignmentMode('manual');
            setRangeStart(1);
            setRangeEnd(10);
        }
    }, [isOpen]);

    // Memoized helper calculations
    const uniqueDepartments = useMemo(() => {
        const depts = [...new Set(students.map(s => s.department))];
        return depts.filter(Boolean).sort();
    }, [students]);

    const uniqueSemesters = useMemo(() => {
        const sems = [...new Set(students.map(s => s.semester))];
        return sems.filter(s => s && !isNaN(s)).sort((a, b) => a - b);
    }, [students]);

    const availableStudents = useMemo(() => {
        const assignedStudentIds = new Set();
        mentors.forEach(mentor => {
            if (mentor.assignedStudents) {
                mentor.assignedStudents.forEach(assignment => {
                    const sId = assignment.studentId || (assignment.student && assignment.student.id);
                    if (sId) assignedStudentIds.add(sId);
                });
            }
        });

        let available = students.filter(student => !assignedStudentIds.has(student.id));

        if (filterDepartment) {
            available = available.filter(student => student.department === filterDepartment);
        }

        if (filterSemester) {
            const semInt = parseInt(filterSemester);
            available = available.filter(student => student.semester === semInt);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            available = available.filter(student =>
                (student.name && student.name.toLowerCase().includes(term)) ||
                (student.studentId && student.studentId.toLowerCase().includes(term))
            );
        }

        return available;
    }, [mentors, students, filterDepartment, filterSemester, searchTerm]);

    if (!isOpen) return null;

    const handleRangeSelection = () => {
        const available = availableStudents;
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
            if (selectedStudents.length === 0 || !selectedMentor) {
                error('Please select a mentor and at least one student');
                return;
            }

            if (selectedStudents.length === 1) {
                await adminAPI.assignStudentToMentor({
                    studentId: selectedStudents[0],
                    mentorId: selectedMentor
                });
            } else {
                await adminAPI.bulkAssignStudents({
                    studentIds: selectedStudents,
                    mentorId: selectedMentor
                });
            }

            success(`Successfully assigned ${selectedStudents.length} student(s) to mentor`);
            onAssignSuccess();
            onClose();
        } catch (err) {
            error(err.message || 'Failed to assign students');
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
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                                <UserPlus size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                Assign Students to Mentor
                            </h3>
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
                        {/* Select Mentor */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-dark-muted">Select Mentor</label>
                            <div className="relative">
                                <select
                                    value={selectedMentor}
                                    onChange={(e) => setSelectedMentor(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white transition-shadow appearance-none outline-none shadow-sm"
                                >
                                    <option value="">Choose a mentor...</option>
                                    {mentors.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.studentCount || (m.assignedStudents ? m.assignedStudents.length : 0)}/{m.maxStudents || 30} students)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight className="rotate-90" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-dark-muted">
                                    Select Students <span className="text-primary-400 ml-1">({selectedStudents.length} selected)</span>
                                </label>
                                <div className="flex bg-dark-surface p-1 rounded-lg">
                                    <button
                                        onClick={() => setAssignmentMode('manual')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${assignmentMode === 'manual' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-muted hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => setAssignmentMode('range')}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${assignmentMode === 'range' ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-muted hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        Range
                                    </button>
                                </div>
                            </div>

                            {/* AI Assignment for Single Student */}
                            {selectedStudents.length === 1 && (
                                <div className="bg-primary-950/20 rounded-xl p-4 border border-primary-500/20">
                                    <AIAssignment
                                        studentId={selectedStudents[0]}
                                        studentName={availableStudents.find(s => s.id === selectedStudents[0])?.name}
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
                                        {uniqueDepartments.map(dept => (
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
                                        {uniqueSemesters.map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {assignmentMode === 'range' ? (
                                <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-4">
                                    <p className="text-sm font-medium text-dark-muted flex items-center gap-2">
                                        <Users size={16} className="text-primary-400" />
                                        {availableStudents.length} available students match filters
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-dark-muted mb-1">Start Index</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={availableStudents.length || 1}
                                                value={rangeStart}
                                                onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-dark-muted mb-1">End Index</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={availableStudents.length || 1}
                                                value={rangeEnd}
                                                onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                                                {availableStudents
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
                                            className="w-full pl-9 pr-4 py-2 text-sm bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-bg/50 h-64 flex flex-col">
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                            {availableStudents.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                    <Search size={24} className="mb-2 opacity-50" />
                                                    <p className="text-sm">No unassigned students found</p>
                                                </div>
                                            ) : (
                                                availableStudents.map(student => (
                                                    <motion.div
                                                        key={student.id}
                                                        whileHover={{ scale: 1.005, backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                        whileTap={{ scale: 0.995 }}
                                                        onClick={() => toggleStudentSelection(student.id)}
                                                        className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center justify-between group ${selectedStudents.includes(student.id)
                                                            ? 'bg-primary-500/10 border-primary-500/30 shadow-sm'
                                                            : 'bg-dark-surface border-dark-border/40 hover:border-dark-border/80'
                                                            }`}
                                                    >
                                                        <div>
                                                            <p className={`text-sm font-medium ${selectedStudents.includes(student.id) ? 'text-primary-400' : 'text-white'}`}>
                                                                {student.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-xs text-dark-muted">{student.studentId}</p>
                                                                <span className="text-slate-300">•</span>
                                                                <p className="text-xs text-dark-muted">{student.department}</p>
                                                            </div>
                                                        </div>
                                                        {selectedStudents.includes(student.id) && (
                                                            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30">
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
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-dark-border bg-dark-bg flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAssignStudents}
                            disabled={selectedStudents.length === 0 || !selectedMentor}
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
