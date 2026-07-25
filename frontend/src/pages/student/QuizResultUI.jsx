import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Award, Sparkles, Target, BookOpen, Lightbulb } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageWrapper from '../../components/layout/PageWrapper';

// Displays final score & AI Personalized Feedback passed via router state from the Quiz Attempt UI.
const QuizResultUI = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    
    const score = state?.score ?? '--';
    const totalQuestions = state?.totalQuestions ?? '--';

    // Parse AI Feedback if present
    const [aiFeedback, setAiFeedback] = useState(null);

    useEffect(() => {
        if (state?.aiFeedback) {
            try {
                const parsed = typeof state.aiFeedback === 'string' ? JSON.parse(state.aiFeedback) : state.aiFeedback;
                setAiFeedback(parsed);
            } catch (e) {
                console.error("Failed to parse AI Feedback JSON", e);
                setAiFeedback(null);
            }
        }
    }, [state]);

    return (
        <PageWrapper title="Quiz Results">
            <div className="max-w-3xl mx-auto mt-8 space-y-8">
                
                {/* Score & Attempt Summary Header */}
                <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 text-center relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/20 mb-8 relative z-10 text-white">
                        <Award size={48} />
                    </div>
                    
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 relative z-10">Quiz Completed!</h1>
                    <p className="text-dark-muted text-lg relative z-10">Attempt ID: <span className="font-mono text-xs bg-dark-bg px-2 py-1 rounded">{attemptId}</span></p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="p-6 bg-dark-bg rounded-xl border border-dark-border flex flex-col items-center">
                            <span className="text-dark-muted text-sm font-semibold uppercase tracking-wider mb-2">Final Score</span>
                            <span className="text-3xl font-black text-white">{score}</span>
                        </div>
                        <div className="p-6 bg-dark-bg rounded-xl border border-dark-border flex flex-col items-center">
                            <span className="text-dark-muted text-sm font-semibold uppercase tracking-wider mb-2">Total Questions</span>
                            <span className="text-3xl font-black text-emerald-400 flex items-center gap-2">
                                <CheckCircle size={28} />
                                {totalQuestions}
                            </span>
                        </div>
                        <div className="p-6 bg-dark-bg rounded-xl border border-dark-border flex flex-col items-center">
                            <span className="text-dark-muted text-sm font-semibold uppercase tracking-wider mb-2">Status</span>
                            <span className="text-xl font-bold text-primary-400 flex items-center gap-2 mt-2">
                                <Award size={24} />
                                Completed
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Personalized Performance & Feedback Section (Rendered only when aiFeedback is present) */}
                {aiFeedback && (
                    <div className="bg-dark-surface/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        {/* AI Header */}
                        <div className="flex items-center gap-3 border-b border-dark-border pb-4 mb-6">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-wide">AI Performance Feedback</h3>
                                <p className="text-xs text-secondary-500">Personalized Gemini Insights</p>
                            </div>
                        </div>

                        {/* Overall Summary */}
                        {aiFeedback.overallSummary && (
                            <div className="bg-dark-bg/70 border border-dark-border rounded-xl p-5 mb-6">
                                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                                    {aiFeedback.overallSummary}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Strengths List */}
                            {aiFeedback.strengths && aiFeedback.strengths.length > 0 && (
                                <div className="bg-dark-bg/60 border border-emerald-500/20 rounded-xl p-5">
                                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Strengths & Mastered Topics
                                    </h4>
                                    <ul className="space-y-2.5">
                                        {aiFeedback.strengths.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                                                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Weak Areas List */}
                            {aiFeedback.weakAreas && aiFeedback.weakAreas.length > 0 && (
                                <div className="bg-dark-bg/60 border border-amber-500/20 rounded-xl p-5">
                                    <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Target size={16} />
                                        Areas to Improve
                                    </h4>
                                    <ul className="space-y-3">
                                        {aiFeedback.weakAreas.map((area, idx) => (
                                            <li key={idx} className="bg-dark-surface/50 p-3 rounded-lg border border-dark-border text-xs">
                                                <span className="font-bold text-white block mb-1">{area.topic}</span>
                                                <span className="text-slate-400">{area.reason}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Recommendations List */}
                        {aiFeedback.recommendations && aiFeedback.recommendations.length > 0 && (
                            <div className="bg-dark-bg/60 border border-indigo-500/20 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Lightbulb size={16} />
                                    Recommended Next Steps
                                </h4>
                                <ul className="space-y-2.5">
                                    {aiFeedback.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                                            <span className="text-indigo-400 font-bold mt-0.5">→</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Navigation Action Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button onClick={() => navigate('/student/dashboard')} variant="secondary" className="px-6 py-3 border-dark-border hover:bg-dark-bg">
                        Return to Dashboard
                    </Button>
                    <Button onClick={() => navigate('/student/quizzes')} className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/25 border-none">
                        Browse More Quizzes <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default QuizResultUI;
