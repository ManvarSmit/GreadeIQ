import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, GraduationCap, Home, Activity, DollarSign } from 'lucide-react';
import { studentAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

/** Light modal fields: app body uses light text on dark bg; inputs must not inherit that onto white backgrounds. */
const inputBase =
    'w-full px-3 py-2 rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow';
const inputNormal = `${inputBase} border-slate-300`;
const inputErr = (hasError) => (hasError ? `${inputBase} border-red-500` : inputNormal);

const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');

    const [formData, setFormData] = useState({
        // Personal Information
        studentId: '',
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',

        // Academic Information
        department: '',
        semester: '',
        currentCGPA: '',
        attendancePercent: '',

        // Family & Socioeconomic
        familyIncome: '',
        parentEducation: '',
        distanceFromHome: '',

        // Behavioral Data
        libraryVisits: '',
        extracurricular: false,
        disciplinaryIssues: '',

        // Fee Information
        totalFees: '',
        feesPaid: '',
        feesPending: '',
        paymentStatus: 'PENDING'
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.department.trim()) newErrors.department = 'Department is required';
        if (!formData.semester) newErrors.semester = 'Semester is required';

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Number validations
        if (formData.currentCGPA && (parseFloat(formData.currentCGPA) < 0 || parseFloat(formData.currentCGPA) > 10)) {
            newErrors.currentCGPA = 'CGPA must be between 0 and 10';
        }
        if (formData.attendancePercent && (parseFloat(formData.attendancePercent) < 0 || parseFloat(formData.attendancePercent) > 100)) {
            newErrors.attendancePercent = 'Attendance must be between 0 and 100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toastError('Please fix the form errors');
            return;
        }

        try {
            setLoading(true);

            // Prepare data for API
            const studentData = {
                studentId: formData.studentId.trim(),
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim() || null,
                dateOfBirth: formData.dateOfBirth || null,
                gender: formData.gender || null,
                department: formData.department.trim(),
                semester: parseInt(formData.semester),
                currentCGPA: formData.currentCGPA ? parseFloat(formData.currentCGPA) : 0.0,
                attendancePercent: formData.attendancePercent ? parseFloat(formData.attendancePercent) : 0.0,
                familyIncome: formData.familyIncome ? parseFloat(formData.familyIncome) : null,
                parentEducation: formData.parentEducation.trim() || null,
                distanceFromHome: formData.distanceFromHome ? parseFloat(formData.distanceFromHome) : null,
                libraryVisits: formData.libraryVisits ? parseInt(formData.libraryVisits) : 0,
                extracurricular: formData.extracurricular,
                disciplinaryIssues: formData.disciplinaryIssues ? parseInt(formData.disciplinaryIssues) : 0,
            };

            const result = await studentAPI.create(studentData);

            // Create fee record if fee data is provided
            if (formData.totalFees) {
                // Fee record will be created by backend if needed
                // For now, we'll just include it in the success message
            }

            success('Student created successfully!');
            onSuccess();
            handleClose();
        } catch (err) {
            console.error('Create student error:', err);
            toastError(err.message || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    const handleClose = () => {
        setFormData({
            studentId: '', name: '', email: '', phone: '', dateOfBirth: '', gender: '',
            department: '', semester: '', currentCGPA: '', attendancePercent: '',
            familyIncome: '', parentEducation: '', distanceFromHome: '',
            libraryVisits: '', extracurricular: false, disciplinaryIssues: '',
            totalFees: '', feesPaid: '', feesPending: '', paymentStatus: 'PENDING'
        });
        setErrors({});
        setActiveSection('personal');
        onClose();
    };

    if (!isOpen) return null;

    const sections = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'academic', label: 'Academic', icon: GraduationCap },
        { id: 'family', label: 'Family & Social', icon: Home },
        { id: 'behavioral', label: 'Behavioral', icon: Activity },
        { id: 'fees', label: 'Fee Details', icon: DollarSign }
    ];

    const modal = (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 overflow-y-auto backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-modal-title"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) handleClose();
            }}
        >
            <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full my-8 shadow-2xl ring-1 ring-slate-200/80">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/80 rounded-t-xl">
                    <h2 id="add-student-modal-title" className="text-2xl font-bold text-slate-900">
                        Add New Student
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                        disabled={loading}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 p-4 border-b border-slate-200 overflow-x-auto bg-white">
                    {sections.map(section => {
                        const Icon = section.icon;
                        return (
                            <button
                                type="button"
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${activeSection === section.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                <Icon size={16} />
                                {section.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {/* Personal Information */}
                        {activeSection === 'personal' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            Student ID <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="studentId"
                                            value={formData.studentId}
                                            onChange={handleChange}
                                            className={inputErr(errors.studentId)}
                                            placeholder="e.g., STU001"
                                        />
                                        {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={inputErr(errors.name)}
                                            placeholder="e.g., John Doe"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={inputErr(errors.email)}
                                            placeholder="e.g., john@university.edu"
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., +1234567890"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className={inputNormal}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={inputNormal}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Academic Information */}
                        {activeSection === 'academic' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className={inputErr(errors.department)}
                                        >
                                            <option value="">Select Department</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Mechanical">Mechanical</option>
                                            <option value="Civil">Civil</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Information Technology">Information Technology</option>
                                        </select>
                                        {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            Semester <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleChange}
                                            className={inputErr(errors.semester)}
                                        >
                                            <option value="">Select Semester</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                        {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Current CGPA</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="currentCGPA"
                                            value={formData.currentCGPA}
                                            onChange={handleChange}
                                            className={inputErr(errors.currentCGPA)}
                                            placeholder="e.g., 8.5"
                                            min="0"
                                            max="10"
                                        />
                                        {errors.currentCGPA && <p className="text-red-500 text-xs mt-1">{errors.currentCGPA}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Attendance %</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="attendancePercent"
                                            value={formData.attendancePercent}
                                            onChange={handleChange}
                                            className={inputErr(errors.attendancePercent)}
                                            placeholder="e.g., 92"
                                            min="0"
                                            max="100"
                                        />
                                        {errors.attendancePercent && <p className="text-red-500 text-xs mt-1">{errors.attendancePercent}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Family & Socioeconomic */}
                        {activeSection === 'family' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Family Income (Annual)</label>
                                        <input
                                            type="number"
                                            name="familyIncome"
                                            value={formData.familyIncome}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 500000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Parent Education</label>
                                        <select
                                            name="parentEducation"
                                            value={formData.parentEducation}
                                            onChange={handleChange}
                                            className={inputNormal}
                                        >
                                            <option value="">Select Education Level</option>
                                            <option value="No Formal Education">No Formal Education</option>
                                            <option value="Primary">Primary</option>
                                            <option value="Secondary">Secondary</option>
                                            <option value="Higher Secondary">Higher Secondary</option>
                                            <option value="Graduate">Graduate</option>
                                            <option value="Post Graduate">Post Graduate</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Distance from Home (km)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="distanceFromHome"
                                            value={formData.distanceFromHome}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 25.5"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Behavioral Data */}
                        {activeSection === 'behavioral' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Library Visits (per month)</label>
                                        <input
                                            type="number"
                                            name="libraryVisits"
                                            value={formData.libraryVisits}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 10"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Disciplinary Issues</label>
                                        <input
                                            type="number"
                                            name="disciplinaryIssues"
                                            value={formData.disciplinaryIssues}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 0"
                                            min="0"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="extracurricular"
                                                checked={formData.extracurricular}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Participates in Extracurricular Activities</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fee Information */}
                        {activeSection === 'fees' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Total Fees</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="totalFees"
                                            value={formData.totalFees}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 100000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Fees Paid</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="feesPaid"
                                            value={formData.feesPaid}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 50000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Fees Pending</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="feesPending"
                                            value={formData.feesPending}
                                            onChange={handleChange}
                                            className={inputNormal}
                                            placeholder="e.g., 50000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Payment Status</label>
                                        <select
                                            name="paymentStatus"
                                            value={formData.paymentStatus}
                                            onChange={handleChange}
                                            className={inputNormal}
                                        >
                                            <option value="PAID">Paid</option>
                                            <option value="PARTIAL">Partial</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="OVERDUE">Overdue</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                        <p className="text-sm text-slate-600">
                            <span className="text-red-500">*</span> Required fields
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Student'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default AddStudentModal;
