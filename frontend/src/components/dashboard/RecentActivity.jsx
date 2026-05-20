import Card from '../ui/Card';
import { Clock, AlertTriangle, CheckCircle, UserPlus, FileText } from 'lucide-react';

const ActivityItem = ({ icon: Icon, color, title, time, user }) => (
    <div className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer relative overflow-hidden">
        <div className={`mt-1 p-2.5 rounded-xl h-fit flex-shrink-0 shadow-sm border border-transparent group-hover:border-current/10 transition-colors ${color}`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-white truncate group-hover:text-primary-400 transition-colors tracking-wide">
                {title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-dark-muted font-medium tracking-wider uppercase">{user}</span>
                <span className="w-1 h-1 rounded-full bg-dark-muted/50"></span>
                <span className="text-xs text-dark-muted flex items-center gap-1 font-medium">
                    <Clock size={12} /> {time}
                </span>
            </div>
        </div>
    </div>
);

const RecentActivity = () => {
    // Mock data - replace with API call later
    const activities = [
        {
            id: 1,
            type: 'risk',
            title: 'High risk alert: Sarah Johnson',
            time: '2 hours ago',
            user: 'System AI',
            icon: AlertTriangle,
            color: 'bg-danger-500/10 text-danger-400'
        },
        {
            id: 2,
            type: 'success',
            title: 'Performance improved: Mike Smith',
            time: '4 hours ago',
            user: 'Metrics Watch',
            icon: CheckCircle,
            color: 'bg-success-500/10 text-success-400'
        },
        {
            id: 3,
            type: 'new',
            title: 'New student enrollment',
            time: '1 day ago',
            user: 'Admin',
            icon: UserPlus,
            color: 'bg-info-500/10 text-info-400'
        },
        {
            id: 4,
            type: 'report',
            title: 'Monthly attendance report generated',
            time: '1 day ago',
            user: 'System',
            icon: FileText,
            color: 'bg-purple-500/10 text-purple-400'
        }
    ];

    return (
        <Card className="h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white tracking-wide">Recent Activity</h3>
                <button className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">View All</button>
            </div>
            <div className="space-y-2 -mx-2">
                {activities.map(activity => (
                    <ActivityItem key={activity.id} {...activity} />
                ))}
            </div>
        </Card>
    );
};

export default RecentActivity;
