import { Sparkles, Lightbulb, Target, BookOpenCheck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const AIGuidanceCard = ({ plan, onGenerate, loading }) => {
    if (!plan) {
        return (
            <Card className="border-dashed border-2 border-purple-500/20 bg-purple-950/5 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/20">
                    <Sparkles className="text-purple-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI Success Roadmap</h3>
                <p className="text-dark-muted max-w-sm mb-6">Generate a personalized improvement plan based on this student's unique academic and behavioral patterns.</p>
                <Button onClick={onGenerate} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                    {loading ? 'Analyzing...' : 'Generate AI Plan'}
                </Button>
            </Card>
        );
    }

    return (
        <Card className="border border-dark-border/60 bg-dark-surface/60 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-500">
                <Sparkles size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Personalized AI Guidance</h3>
                            <p className="text-xs text-purple-400 font-semibold">Generated Just Now</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onGenerate} size="sm" className="text-purple-400 hover:bg-purple-500/10">
                        Regenerate
                    </Button>
                </div>

                <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border/60 mb-6 italic text-dark-muted font-medium">
                    "{plan.motivational_message}"
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-all">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-3">
                            <BookOpenCheck size={18} /> Academic
                        </h4>
                        <ul className="space-y-2">
                            {plan.academic_guidance.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-sm text-dark-muted flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
                        <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-3">
                            <Target size={18} /> Behavioral
                        </h4>
                        <ul className="space-y-2">
                            {plan.behavioral_guidance.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-sm text-dark-muted flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/20 transition-all">
                        <h4 className="font-bold text-amber-400 flex items-center gap-2 mb-3">
                            <Lightbulb size={18} /> Resources
                        </h4>
                        <ul className="space-y-2">
                            {plan.resource_recommendations.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-sm text-dark-muted flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default AIGuidanceCard;
