import { Award, TrendingDown, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

const Sparkline = ({ data, color, upward }) => (
    <div className="h-12 w-24">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const KPICard = ({ title, value, change, icon: Icon, color, bgColor, trendData, trendPositive }) => (
    <Card className="relative overflow-hidden border-none shadow-nav hover:shadow-lg transition-all duration-300 group">
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>

        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
                <Icon size={22} />
            </div>
            {trendData && (
                <Sparkline
                    data={trendData}
                    color={trendPositive ? '#22c55e' : '#ef4444'}
                />
            )}
        </div>

        <div>
            <p className="text-dark-muted text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold text-white leading-none">{value}</h3>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1 mb-1 ${change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {change.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {change}
                </span>
            </div>
        </div>
    </Card>
);

const KPIStats = ({ stats }) => {
    // Mock trend data generator
    const generateTrend = (base, volatility) =>
        Array.from({ length: 10 }, (_, i) => ({
            value: base + Math.sin(i) * volatility + (Math.random() * volatility)
        }));

    const cards = [
        {
            title: 'Success Rate',
            value: `${stats.successRate}%`,
            change: '+5.2%',
            icon: Award,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            trendData: generateTrend(75, 5),
            trendPositive: true
        },
        {
            title: 'Dropout Rate',
            value: `${stats.dropoutRate}%`,
            change: '-1.7%',
            icon: TrendingDown,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            trendData: generateTrend(20, 3).reverse(), // visually going down is good for dropout? actually sparkline just shows trend.
            trendPositive: true // interpreted as "Good direction"
        },
        {
            title: 'Active Interventions',
            value: stats.activeInterventions,
            change: '+12',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            trendData: generateTrend(15, 8),
            trendPositive: true
        },
        {
            title: 'High Risk Students',
            value: stats.highRiskStudents,
            change: '-15',
            icon: AlertTriangle,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            trendData: generateTrend(40, 10).reverse(),
            trendPositive: false // Declining number of risk students is good, but let's keep color logic simple
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <KPICard key={index} {...card} />
            ))}
        </div>
    );
};

export default KPIStats;
