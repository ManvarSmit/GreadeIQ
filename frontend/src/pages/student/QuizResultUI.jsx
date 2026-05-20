import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageWrapper from '../../components/layout/PageWrapper';

// Displays final score passed via router state from the Quiz Attempt UI.
const QuizResultUI = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    
    const score = state?.score ?? '--';
    const totalQuestions = state?.totalQuestions ?? '--';

    return (
        <PageWrapper title="Quiz Results">
            <div className="max-w-3xl mx-auto mt-12 bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 text-center relative overflow-hidden">
                
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/20 mb-8 relative z-10 text-white">
                    <Award size={48} />
                </div>
                
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 relative z-10">Quiz Completed!</h1>
                <p className="text-dark-muted text-lg relative z-10">Attempt ID: <span className="font-mono text-xs bg-dark-bg px-2 py-1 rounded">{attemptId}</span></p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
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

                <div className="mt-12 flex justify-center gap-4 relative z-10">
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
