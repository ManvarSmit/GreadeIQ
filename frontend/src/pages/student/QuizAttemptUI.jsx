import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';

const QuizAttemptUI = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attemptId, setAttemptId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [violationAlert, setViolationAlert] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);

    // Fetch quiz data and initialize attempt
    useEffect(() => {
        const fetchAndStartQuiz = async () => {
            try {
                // In a real app we'd fetch actual questions. For now, mock it if not present.
                const response = await quizAPI.getQuizById(id).catch(() => ({ 
                    data: { 
                        id, 
                        title: 'Sample AI Quiz', 
                        durationMinutes: 30, 
                        questions: [
                            { id: 1, question: 'What is O(1) complexity?', options: ['Constant time', 'Linear time', 'Exponential time', 'Quadratic time'] },
                            { id: 2, question: 'Which is not a sorting algorithm?', options: ['Merge Sort', 'Quick Sort', 'Binary Search', 'Heap Sort'] }
                        ] 
                    } 
                }));
                const startResponse = await quizAPI.startQuiz(id).catch(() => ({ data: { id: 'mock-attempt-it' }}));
                
                setQuiz(response.data);
                setAttemptId(startResponse.data.id);
                setTimeLeft(response.data.durationMinutes * 60);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load quiz", error);
                navigate('/student/dashboard');
            }
        };

        fetchAndStartQuiz();
    }, [id, navigate]);

    // Timer logic
    useEffect(() => {
        if (loading || submitted || timeLeft <= 0 || !hasStarted) return;

        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [loading, submitted, timeLeft]);

    const submitQuizAction = useCallback(async (isAuto = false) => {
        if (submitted || !attemptId) return;
        setSubmitted(true);
        try {
            const res = await quizAPI.submitQuiz(attemptId, { answers, isAutoSubmitted: isAuto });
            const scoreReceived = res.data?.data?.score ?? res.data?.score ?? 0;
            
            // Exit fullscreen
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(err => console.error(err));
            }
            navigate(`/student/quiz/${id}/result/${attemptId}`, { 
                state: { score: scoreReceived, totalQuestions: quiz.questions?.length }
            });
        } catch (error) {
            console.error(error);
            navigate(`/student/quiz/${id}/result/${attemptId}`, { 
                state: { score: 'Error', totalQuestions: quiz.questions?.length }
            });
        }
    }, [answers, attemptId, submitted, navigate, id]);

    const handleAutoSubmit = useCallback(() => {
        submitQuizAction(true);
    }, [submitQuizAction]);

    // Anti-Cheating integration
    const handleViolation = useCallback(async (type, count, isTerminal) => {
        setViolationAlert(`Warning: You switched tabs or lost focus (${count}/3 violations).`);
        try {
            if (attemptId) {
                await quizAPI.logViolation(attemptId, { violationType: type });
            }
        } catch (e) {
            console.error("Failed to log violation", e);
        }
        
        setTimeout(() => setViolationAlert(null), 5000);

        if (isTerminal) {
            alert("Maximum violations reached. Your quiz is being automatically submitted.");
            handleAutoSubmit();
        }
    }, [attemptId, handleAutoSubmit]);

    useAntiCheat(handleViolation, 3);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleOptionSelect = (qId, optionUrl) => {
        setAnswers(prev => ({ ...prev, [qId]: optionUrl }));
    };

    const enterFullscreenAndStart = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error("Fullscreen request failed", err);
            // Optionally, we can block starting if device denies full screen
        }
        setHasStarted(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center font-sans text-dark-text">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500/20 border-t-primary-500"></div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
                <div className="max-w-xl w-full bg-dark-surface/80 backdrop-blur border border-dark-border rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <ShieldAlert size={64} className="mx-auto text-primary-500 mb-6" />
                    <h1 className="text-3xl font-extrabold text-white mb-2 tracking-wide">{quiz.title}</h1>
                    <p className="text-dark-muted mb-8 leading-relaxed">
                        This is a proctored assessment. By starting, you agree to enter <strong className="text-primary-400">fullscreen mode</strong>. Navigating away, opening new tabs, or minimizing the window will be logged as cheating violations. <br/><br/>3 violations will result in auto-submission and a 0 score.
                    </p>
                    <div className="bg-dark-bg rounded-lg p-4 flex justify-between items-center mb-10 border border-dark-border">
                        <div className="text-left">
                            <span className="block text-xs text-dark-muted uppercase font-bold tracking-wider mb-1">Duration</span>
                            <span className="text-xl font-bold text-white tracking-tight">{quiz.durationMinutes} Minutes</span>
                        </div>
                        <div className="h-8 w-px bg-dark-border"></div>
                        <div className="text-right">
                            <span className="block text-xs text-dark-muted uppercase font-bold tracking-wider mb-1">Questions</span>
                            <span className="text-xl font-bold text-white tracking-tight">{quiz.questions?.length || 0}</span>
                        </div>
                    </div>
                    <Button onClick={enterFullscreenAndStart} className="w-full py-4 text-lg bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/25 border-none font-bold tracking-wide">
                        Agree & Start Assessment
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg text-dark-text font-sans flex flex-col selection:bg-primary-500/30">
            {/* Top Bar fixed */}
            <header className="fixed top-0 w-full h-16 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border z-50 flex items-center justify-between px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-primary-400" />
                    <h1 className="text-lg font-bold tracking-wide text-white">{quiz.title}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-lg border ${timeLeft < 300 ? 'bg-danger-500/10 text-danger-400 border-danger-500/20 animate-pulse' : 'bg-dark-bg text-white border-dark-border'}`}>
                        <Clock size={18} />
                        {formatTime(timeLeft)}
                    </div>
                    <Button onClick={() => submitQuizAction(false)} className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/25 border-none">
                        Submit Quiz
                    </Button>
                </div>
            </header>

            {/* Violation Alert Pop-up */}
            {violationAlert && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-danger-500 text-white px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center gap-3 animate-slide-up">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">{violationAlert}</span>
                </div>
            )}

            {/* Quiz Content Container */}
            <main className="flex-1 max-w-4xl mx-auto w-full pt-28 pb-20 px-4 lg:px-0">
                <div className="mb-8 p-6 bg-dark-surface/50 border border-primary-500/20 rounded-2xl glass-panel text-center">
                    <p className="text-dark-muted mb-2">Instructions</p>
                    <h2 className="text-xl font-bold text-white tracking-wide">AI Monitored Assessment</h2>
                    <p className="text-sm text-dark-muted mt-2 max-w-2xl mx-auto">
                        Do not switch tabs, minimize the window, or lose focus. Our anti-cheating system is active. 3 violations will result in auto-submission and a zero score.
                    </p>
                </div>

                <div className="space-y-8">
                    {quiz.questions && quiz.questions.map((q, index) => (
                        <div key={q.id} className="p-8 bg-dark-surface border border-dark-border rounded-2xl shadow-xl transition-all duration-300 hover:border-dark-border/80">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center font-bold text-sm border border-primary-500/20">
                                    {index + 1}
                                </span>
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-white mb-6 leading-relaxed">{q.question}</h3>
                                    <div className="space-y-3">
                                        {q.options && q.options.map((option, oIdx) => (
                                            <label 
                                                key={oIdx} 
                                                className={`flex items-center p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                                                    answers[q.id] === option 
                                                        ? 'bg-primary-500/10 border-primary-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                                                        : 'bg-dark-bg/50 border-white/5 hover:border-dark-muted/30 hover:bg-white/5'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name={`question-${q.id}`} 
                                                    value={option} 
                                                    checked={answers[q.id] === option}
                                                    onChange={() => handleOptionSelect(q.id, option)}
                                                    className="w-4 h-4 text-primary-500 bg-dark-surface border-dark-border focus:ring-primary-500/50 focus:ring-offset-dark-bg"
                                                />
                                                <span className={`ml-4 text-[15px] ${answers[q.id] === option ? 'text-primary-300 font-medium' : 'text-dark-muted'}`}>
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center border-t border-dark-border pt-12 pb-8">
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">Finished with the Assessment?</h3>
                    <p className="text-dark-muted mb-8 max-w-lg mx-auto">Double check your answers before submitting. Once submitted, you cannot change your choices or retake this quiz.</p>
                    <Button onClick={() => submitQuizAction(false)} className="px-10 py-5 text-lg bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] border-none font-bold tracking-wide rounded-xl">
                        Submit Final Answers
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default QuizAttemptUI;
