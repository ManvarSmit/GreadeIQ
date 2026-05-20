import Card from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatsCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel = 'vs last month',
    color = 'primary',
    delay = 0
}) => {
    const colors = {
        primary: 'bg-primary-500/10 text-primary-400',
        success: 'bg-success-500/10 text-success-400',
        warning: 'bg-warning-500/10 text-warning-400',
        danger: 'bg-danger-500/10 text-danger-400',
        info: 'bg-info-500/10 text-info-400',
        purple: 'bg-purple-500/10 text-purple-400'
    };

    const trendColors = {
        up: 'text-success-400',
        down: 'text-danger-400',
        neutral: 'text-dark-muted'
    };

    const getTrendIcon = () => {
        if (trend > 0) return <ArrowUpRight size={16} />;
        if (trend < 0) return <ArrowDownRight size={16} />;
        return <Minus size={16} />;
    };

    const trendColor = trend > 0 ? trendColors.up : trend < 0 ? trendColors.down : trendColors.neutral;

    return (
        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor} bg-dark-bg/50 px-2 py-1 rounded-lg border border-dark-border shadow-sm`}>
                        {getTrendIcon()}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-dark-muted text-sm font-medium mb-1 tracking-wide">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-white">{value}</h2>
                </div>
                {trendLabel && (
                    <p className="text-xs text-dark-muted/80 mt-2">{trendLabel}</p>
                )}
            </div>
        </Card>
    );
};

export default StatsCard;
