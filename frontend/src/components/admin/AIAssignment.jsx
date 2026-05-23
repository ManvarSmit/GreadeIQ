import { useState } from 'react';
import { aiAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Sparkles, Brain, AlertCircle, CheckCircle2, TrendingUp, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const PROBLEM_CATEGORIES = {
    academic_struggles: { label: 'Academic Struggles', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    family_issues: { label: 'Family Issues', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    financial_problems: { label: 'Financial Problems', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    health_concerns: { label: 'Health Concerns', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    mental_health: { label: 'Mental Health', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    bereavement: { label: 'Bereavement/Loss', color: 'bg-dark-surface text-dark-muted border-dark-border' },
    social_isolation: { label: 'Social Isolation', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    attendance_issues: { label: 'Attendance Issues', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    substance_abuse: { label: 'Substance Abuse', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    career_confusion: { label: 'Career Confusion', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' }
};

const AIAssignment = ({ studentId, studentName, onMentorSelect }) => {
    const { success, error } = useToast();
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            setAnalysis(null);
            setSuggestions([]);

            // Step 1: Analyze student problems
            const analyzeResponse = await aiAPI.analyzeStudent(studentId);
            const analysisData = analyzeResponse.data.data;

            // Artificial delay for better UX (so user sees the "Analyzing" state)
            await new Promise(resolve => setTimeout(resolve, 800));

            setAnalysis(analysisData);

            // Step 2: Get mentor suggestions
            const suggestResponse = await aiAPI.suggestMentors(studentId);
            const suggestionsData = suggestResponse.data.data;

            setSuggestions(suggestionsData.suggestions);

            success('AI Analysis completed!');
        } catch (err) {
            console.error(err);
            error(err.response?.data?.message || 'Failed to analyze student');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAutoAssign = async () => {
        try {
            if (suggestions.length === 0) return;

            setAnalyzing(true);
            const response = await aiAPI.autoAssignMentor(studentId);

            success(`Successfully assigned to ${response.data.mentorName}`);

            // Notify parent
            if (onMentorSelect) {
                // We don't have the ID in the response directly as 'mentorId', but we know it's suggestions[0].id usually. 
                // But safer to rely on what we have or just refresh.
                // The parent (UserManagementSection) might need to know the ID to update state?
                // Actually UserManagementSection uses onMentorSelect to set selectedMentor. 
                // But autoAssign call ALREADY performed the assignment in backend.
                // So we should probably callback with a success flag or reload?
                // For now, let's just use the ID we have from suggestions.
                onMentorSelect(suggestions[0].id);
            }
        } catch (err) {
            console.error(err);
            error(err.response?.data?.message || 'Auto-assignment failed');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="bg-dark-surface rounded-2xl border border-dark-border p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                        <Sparkles className="text-primary-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">AI-Powered Assignment</h3>
                        <p className="text-xs text-secondary-500">Powered by Gemini AI</p>
                    </div>
                </div>

                {!analysis && !analyzing && (
                    <Button
                        onClick={handleAnalyze}
                        variant="primary"
                        className="shadow-md shadow-indigo-500/20"
                    >
                        <Brain size={16} className="mr-2" />
                        Analyze Student
                    </Button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {analyzing ? (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                    >
                        <div className="relative mb-4">
                            <div className="w-16 h-16 border-4 border-indigo-950 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={24} />
                        </div>
                        <p className="text-sm font-medium text-dark-muted">Analyzing student profile...</p>
                        <p className="text-xs text-dark-muted mt-1">Identifying key challenges and matching mentors</p>
                    </motion.div>
                ) : analysis ? (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6 relative z-10"
                    >
                        {/* Summary Card */}
                        <div className="bg-dark-bg/60 backdrop-blur-sm rounded-xl p-5 border border-dark-border shadow-sm">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-500" />
                                Analysis Summary
                            </h4>
                            <p className="text-sm text-dark-muted leading-relaxed mb-4">
                                {analysis.summary}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {analysis.categories?.map((category) => {
                                    const config = PROBLEM_CATEGORIES[category] || { label: category, color: 'bg-dark-surface text-dark-muted border-dark-border' };
                                    return (
                                        <span
                                            key={category}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
                                        >
                                            {config.label}
                                        </span>
                                    );
                                })}
                            </div>

                            {analysis.confidence && (
                                <div className="bg-dark-bg rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Confidence Level</span>
                                    <div className="flex-1 h-2 bg-dark-surface rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                                            style={{ width: `${analysis.confidence * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-primary-400">{Math.round(analysis.confidence * 100)}%</span>
                                </div>
                            )}
                        </div>

                        {/* Mentor Suggestions */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-500" />
                                Recommended Mentors
                            </h4>

                            {suggestions.length > 0 ? (
                                <div className="space-y-3">
                                    {suggestions.slice(0, 3).map((mentor, index) => (
                                        <motion.div
                                            key={mentor.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => onMentorSelect && onMentorSelect(mentor.id)}
                                            className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${mentor.isRecommended
                                                ? 'bg-dark-bg border-primary-500/50 hover:border-primary-500'
                                                : 'bg-dark-bg border-transparent hover:border-dark-border'
                                                }`}
                                        >
                                            {mentor.isRecommended && (
                                                <div className="absolute -top-3 -right-3 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm shadow-primary-500/30 uppercase tracking-wide">
                                                    Top Match
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h5 className="font-bold text-white group-hover:text-primary-400 transition-colors">
                                                        {mentor.name}
                                                    </h5>
                                                    <p className="text-xs text-dark-muted mt-1">
                                                        {mentor.specialization || 'General Mentoring'} • {mentor.department || 'All Depts'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Load</div>
                                                    <div className={`text-sm font-bold ${(mentor.currentLoad / mentor.maxStudents) > 0.9 ? 'text-rose-500' : 'text-emerald-600'
                                                        }`}>
                                                        {mentor.currentLoad}/{mentor.maxStudents}
                                                    </div>
                                                </div>
                                            </div>

                                            {mentor.matchedCategories?.length > 0 && (
                                                <div className="mt-3 py-2 border-t border-dark-border flex flex-wrap gap-1.5">
                                                    <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Strong in:</span>
                                                    {mentor.matchedCategories.map(cat => {
                                                        const config = PROBLEM_CATEGORIES[cat];
                                                        return config ? (
                                                            <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-dark-surface text-dark-muted rounded">
                                                                {config.label}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-dark-bg rounded-xl border border-dashed border-dark-border">
                                    <p className="text-sm text-dark-muted">No suitable mentors found based on current criteria.</p>
                                </div>
                            )}
                        </div>

                        {/* Auto-Assign Button */}
                        {suggestions.length > 0 && suggestions[0].isRecommended && (
                            <div className="mt-2 mb-4">
                                <Button
                                    onClick={handleAutoAssign}
                                    variant="secondary"
                                    className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 hover:from-indigo-700 hover:to-purple-700 shadow-md transform transition-all hover:-translate-y-0.5"
                                >
                                    <Sparkles size={16} className="mr-2 text-yellow-300" />
                                    Auto-Assign Best Match
                                </Button>
                                <p className="text-xs text-center text-dark-muted mt-2">
                                    Automatically assigns <span className="font-semibold text-dark-muted">{suggestions[0].name}</span> based on compatibility.
                                </p>
                            </div>
                        )}

                        {/* Re-analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            className="w-full py-2.5 text-sm font-medium text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Re-analyze with latest data
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default AIAssignment;
