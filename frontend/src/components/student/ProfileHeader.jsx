import { User, Mail, Phone, MapPin, Calendar, Edit, Trash2, GraduationCap } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const ProfileHeader = ({ student, onEdit, onDelete }) => {
    const getRiskBadge = (level) => {
        const variants = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };
        return <Badge variant={variants[level || 'LOW']}>{level || 'LOW'} RISK</Badge>;
    };

    return (
        <div className="relative mb-8 group">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-dark-surface/60 backdrop-blur-xl rounded-2xl shadow-lg border border-dark-border -z-10"></div>

            {/* Decorative gradient banner */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-t-2xl opacity-90"></div>

            <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6 relative">

                    {/* Avatar - overlapping the banner */}
                    <div className="-mt-12 flex-shrink-0">
                        <div className="w-32 h-32 rounded-2xl bg-dark-surface border border-dark-border p-2 shadow-[0_0_20px_rgba(0,0,0,0.4)] rotate-3 transition-transform group-hover:rotate-0 duration-300">
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-dark-border">
                                <span className="text-4xl font-bold text-slate-400">
                                    {student.name.charAt(0)}{student.name.split(' ')[1]?.charAt(0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 pt-4 md:pt-0 mt-2">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {student.name}
                                    <span className="text-2xl">{getRiskBadge(student.dropoutRisk)}</span>
                                </h1>
                                <div className="flex items-center gap-2 text-dark-muted mt-1 font-medium">
                                    <GraduationCap size={18} />
                                    <span>{student.department} Department</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>Semester {student.semester}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onEdit}
                                    className="bg-white/50 hover:bg-white text-slate-900 border-dark-border backdrop-blur-sm"
                                >
                                    <Edit size={16} className="mr-2" /> Edit Profile
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={onDelete}
                                    className="shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:bg-white/10 hover:border-primary-500/30 transition-colors">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Mail size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs text-dark-muted font-semibold uppercase">Email</p>
                                    <p className="text-sm font-medium text-white truncate" title={student.email}>{student.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:bg-white/10 hover:border-primary-500/30 transition-colors">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-muted font-semibold uppercase">Phone</p>
                                    <p className="text-sm font-medium text-white">{student.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:bg-white/10 hover:border-primary-500/30 transition-colors">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-muted font-semibold uppercase">Student ID</p>
                                    <p className="text-sm font-medium text-white font-mono">{student.studentId}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-bg/50 border border-dark-border hover:bg-white/10 hover:border-primary-500/30 transition-colors">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-dark-muted font-semibold uppercase">Location</p>
                                    <p className="text-sm font-medium text-white">
                                        {student.distanceFromHome
                                            ? `${student.distanceFromHome} km from home`
                                            : 'Main Campus'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
