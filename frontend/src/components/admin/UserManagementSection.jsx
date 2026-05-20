import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { adminAPI, studentAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Users, UserCog, UserPlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../modals/ConfirmationModal';
import AssignmentModal from './AssignmentModal';

const UserManagementSection = () => {
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState('counselors'); // 'mentors' | 'counselors'
    const [mentors, setMentors] = useState([]);
    const [counselors, setCounselors] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Assignment modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignmentType, setAssignmentType] = useState('student-counselor');

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [mentorsData, counselorsData, studentsData] = await Promise.all([
                adminAPI.getAllMentors(),
                adminAPI.getAllCounselors(),
                studentAPI.getAll({ limit: 1000 })
            ]);
            setMentors(mentorsData.data || []);
            setCounselors(counselorsData.data || []);
            setStudents(studentsData.data || []);
        } catch (err) {
            console.error('Error fetching user management data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (userId, userName, type) => {
        setUserToDelete({ id: userId, name: userName, type });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            await adminAPI.deleteUser(userToDelete.id);
            success(`${userToDelete.type === 'Counselor' ? 'Counselor' : 'Mentor'} deleted successfully`);
            setShowDeleteModal(false);
            fetchData();
        } catch (err) {
            console.error('Delete user error:', err);
            error(err.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const getUniqueDepartments = () => {
        const depts = [...new Set(students.map(s => s.department))];
        return depts.filter(d => d && d !== null && d !== undefined && d !== '').sort();
    };

    const tabVariants = {
        inactive: { borderBottomWidth: 0, opacity: 0.6 },
        active: { borderBottomWidth: 2, opacity: 1, borderColor: '#6366f1', color: '#6366f1' }
    };

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">User Management</h2>
                        <p className="text-sm text-secondary-500">Manage counselors, mentors, and assignments</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => {
                            setAssignmentType('student-counselor');
                            setShowAssignModal(true);
                        }}
                        variant="primary"
                        className="flex-1 sm:flex-none justify-center"
                    >
                        <UserPlus size={16} className="mr-2" />
                        Assign Students
                    </Button>
                    <Button
                        onClick={() => {
                            setAssignmentType('mentor-counselor');
                            setShowAssignModal(true);
                        }}
                        variant="secondary"
                        className="flex-1 sm:flex-none justify-center"
                    >
                        <UserCog size={16} className="mr-2" />
                        Assign Mentor
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-dark-border">
                <motion.button
                    onClick={() => setActiveTab('counselors')}
                    animate={activeTab === 'counselors' ? 'active' : 'inactive'}
                    variants={tabVariants}
                    className="pb-3 text-sm font-semibold transition-colors relative"
                >
                    Counselors
                    <Badge variant="neutral" className="ml-2 bg-dark-surface text-dark-muted">{counselors.length}</Badge>
                </motion.button>
                <motion.button
                    onClick={() => setActiveTab('mentors')}
                    animate={activeTab === 'mentors' ? 'active' : 'inactive'}
                    variants={tabVariants}
                    className="pb-3 text-sm font-semibold transition-colors relative"
                >
                    Mentors
                    <Badge variant="neutral" className="ml-2 bg-dark-surface text-dark-muted">{mentors.length}</Badge>
                </motion.button>
            </div>

            {/* Content Table */}
            <div className="bg-dark-surface/80 backdrop-blur rounded-2xl border border-dark-border shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : activeTab === 'counselors' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-dark-bg border-b border-dark-border">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Email</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Students</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-rose-500 uppercase tracking-wider">High Risk</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Capacity</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Mentors</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {counselors.map((counselor) => (
                                    <tr key={counselor.id} className="hover:bg-dark-bg/80 transition-colors">
                                        <td className="py-4 px-6 text-sm font-medium text-white">{counselor.name}</td>
                                        <td className="py-4 px-6 text-sm text-dark-muted">{counselor.email}</td>
                                        <td className="py-4 px-6 text-center text-sm font-medium text-dark-muted">{counselor.studentCount}</td>
                                        <td className="py-4 px-6 text-center">
                                            {counselor.highRiskCount > 0 && (
                                                <Badge variant="danger" className="text-xs">{counselor.highRiskCount} Students</Badge>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-dark-surface rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${counselor.capacityUsed > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${counselor.capacityUsed}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-dark-muted">{counselor.capacityUsed}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-dark-muted">
                                            {counselor.mentors?.length > 0
                                                ? counselor.mentors.map(m => m.name).join(', ')
                                                : <span className="text-slate-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleDeleteClick(counselor.userId, counselor.name, 'Counselor')}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-dark-bg border-b border-dark-border">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Email</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Specialization</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Students</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Counselors</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Department</th>
                                    <th className="text-center py-4 px-6 text-xs font-semibold text-dark-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mentors.map((mentor) => (
                                    <tr key={mentor.id} className="hover:bg-dark-bg/80 transition-colors">
                                        <td className="py-4 px-6 text-sm font-medium text-white">{mentor.name}</td>
                                        <td className="py-4 px-6 text-sm text-dark-muted">{mentor.email}</td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {mentor.specialization || 'General Mentoring'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm text-dark-muted">{mentor.assignedStudents?.length || 0}</td>
                                        <td className="py-4 px-6 text-center text-sm text-dark-muted">{mentor.counselorCount}</td>
                                        <td className="py-4 px-6 text-sm text-dark-muted">{mentor.department || 'N/A'}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleDeleteClick(mentor.userId, mentor.name, 'Mentor')}
                                                className="p-2 text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            <AssignmentModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssignSuccess={fetchData}
                initialType={assignmentType}
                counselors={counselors}
                mentors={mentors}
                students={students}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title={`Delete ${userToDelete?.type}`}
                message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UserManagementSection;
