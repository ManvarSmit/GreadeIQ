import { AlertTriangle, CheckCircle, TrendingDown, Activity } from 'lucide-react';
import Card from '../ui/Card';

const RiskAnalysisCard = ({ student }) => {
    // Use actual ML probability if available, otherwise estimate from risk level
    const calculateRiskScore = () => {
        switch (student.dropoutRisk) {
            case 'CRITICAL': return 95;
            case 'HIGH': return 75;
            case 'MEDIUM': return 45;
            case 'LOW': return 15;
            default: return 0;
        }
    };

    const getRiskColor = (score) => {
        if (score >= 70) return '#EF4444'; // Red for high risk
        if (score >= 40) return '#F59E0B'; // Orange for medium
        return '#10B981'; // Green for low
    };

    const getRiskText = (score) => {
        if (score >= 70) return 'High Risk';
        if (score >= 40) return 'Medium Risk';
        return 'Low Risk';
    };

    const score = calculateRiskScore();
    const color = getRiskColor(score);
    const text = getRiskText(score);

    // Dynamic Risk Factors
    const riskFactors = [];
    if (student.attendancePercent < 75) riskFactors.push("Low Attendance (< 75%)");
    if (student.currentCGPA < 6.0) riskFactors.push("Critical CGPA (< 6.0)");
    if (student.backlogs > 0) riskFactors.push(`${student.backlogs} Active Backlog(s)`);
    if (score > 50) riskFactors.push("Behavioral Pattern Assessment");

    return (
        <Card className="border-none shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-dark-surface/80 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Activity className="text-indigo-500" size={20} />
                    Risk Analysis
                </h3>
                <span className="px-3 py-1 bg-dark-surface rounded-full text-xs font-bold text-dark-muted">Rule-based Assessment</span>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
                {/* Simple Circular Progress Simulator using CSS Conic Gradient */}
                <div
                    className="w-40 h-40 rounded-full flex items-center justify-center relative shadow-inner"
                    style={{
                        background: `conic-gradient(${color} ${score}%, #E2E8F0 ${score}%)`
                    }}
                >
                    <div className="w-32 h-32 bg-dark-bg border border-dark-border rounded-full flex flex-col items-center justify-center z-10 shadow-inner">
                        <span className="text-4xl font-black text-white">{score}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Risk Score</span>
                    </div>

                    {/* External Glow */}
                    <div className="absolute inset-0 rounded-full blur-xl opacity-20" style={{ backgroundColor: color }}></div>
                </div>

                <p className="mt-4 font-bold text-lg" style={{ color }}>{text} Detected</p>
            </div>

            <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Risk Factors</h4>
                {riskFactors.length > 0 ? (
                    riskFactors.map((factor, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-red-800">{factor}</span>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-emerald-800">No critical risk factors</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default RiskAnalysisCard;
