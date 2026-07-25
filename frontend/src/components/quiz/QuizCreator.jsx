import { useState } from 'react';
import { BookOpen, Clock, Loader2, Plus, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { quizAPI } from '../../services/api';

const QuizCreator = ({ onQuizCreated }) => {
    const [saving, setSaving] = useState(false);

    // Manual Quiz State for Mentors
    const [manualQuiz, setManualQuiz] = useState({
        title: '',
        description: '',
        topics: '',
        durationMinutes: 30,
        difficulty: 'MEDIUM',
        negativeMarking: 0.0,
        questions: [
            {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: '',
                marks: 1.0
            }
        ]
    });

    // --- Question Management Handlers ---
    const handleAddManualQuestion = () => {
        setManualQuiz(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    marks: 1.0
                }
            ]
        }));
    };

    const handleRemoveManualQuestion = (qIndex) => {
        if (manualQuiz.questions.length <= 1) return alert('Quiz must have at least one question.');
        setManualQuiz(prev => ({
            ...prev,
            questions: prev.questions.filter((_, idx) => idx !== qIndex)
        }));
    };

    const handleQuestionTextChange = (qIndex, value) => {
        const updated = [...manualQuiz.questions];
        updated[qIndex].question = value;
        setManualQuiz({ ...manualQuiz, questions: updated });
    };

    const handleOptionTextChange = (qIndex, oIndex, value) => {
        const updated = [...manualQuiz.questions];
        updated[qIndex].options[oIndex] = value;
        setManualQuiz({ ...manualQuiz, questions: updated });
    };

    const handleSelectCorrectAnswer = (qIndex, optionValue) => {
        const updated = [...manualQuiz.questions];
        updated[qIndex].correctAnswer = optionValue;
        setManualQuiz({ ...manualQuiz, questions: updated });
    };

    const handleSaveQuiz = async (e) => {
        e.preventDefault();
        if (!manualQuiz.title.trim()) return alert('Quiz title is required.');
        if (!manualQuiz.topics.trim()) return alert('Target topics are required.');

        for (let i = 0; i < manualQuiz.questions.length; i++) {
            const q = manualQuiz.questions[i];
            if (!q.question.trim()) return alert(`Question ${i + 1} text cannot be empty.`);
            if (q.options.some(opt => !opt.trim())) return alert(`All 4 options for Question ${i + 1} must be filled.`);
            if (!q.correctAnswer.trim()) return alert(`Please select the correct answer for Question ${i + 1}.`);
        }

        setSaving(true);
        try {
            const res = await quizAPI.createQuiz(manualQuiz);
            alert('Academic Quiz published successfully!');
            // Reset form
            setManualQuiz({
                title: '',
                description: '',
                topics: '',
                durationMinutes: 30,
                difficulty: 'MEDIUM',
                negativeMarking: 0.0,
                questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '', marks: 1.0 }]
            });
            if (onQuizCreated) onQuizCreated(res.data);
        } catch (err) {
            console.error('Failed to save quiz', err);
            alert('Failed to publish quiz.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto border-indigo-500/20 shadow-lg shadow-black/20">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-dark-border pb-6 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-xl border border-indigo-500/20">
                    <Edit3 className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Mentor Academic Assessment Creator</h2>
                    <p className="text-sm text-dark-muted">Create custom course quizzes and subject assessments for your mentees</p>
                </div>
            </div>

            {/* Quiz Form */}
            <form onSubmit={handleSaveQuiz} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Quiz Title *</label>
                        <input 
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Midterm Test: Data Structures & Algorithms"
                            value={manualQuiz.title}
                            onChange={e => setManualQuiz({ ...manualQuiz, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Target Topics / Course *</label>
                        <input 
                            required
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Binary Search Trees, Hash Tables, Sorting"
                            value={manualQuiz.topics}
                            onChange={e => setManualQuiz({ ...manualQuiz, topics: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-muted mb-2">Duration (Mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={16} />
                                <input 
                                    type="number"
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                    value={manualQuiz.durationMinutes}
                                    onChange={e => setManualQuiz({ ...manualQuiz, durationMinutes: parseInt(e.target.value) || 30 })}
                                    min="5" max="180"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-muted mb-2">Difficulty</label>
                            <select 
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                value={manualQuiz.difficulty}
                                onChange={e => setManualQuiz({ ...manualQuiz, difficulty: e.target.value })}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-muted mb-2">Instructions / Notes</label>
                        <input 
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Read questions carefully. Anti-cheat proctoring active."
                            value={manualQuiz.description}
                            onChange={e => setManualQuiz({ ...manualQuiz, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Questions List */}
                <div className="pt-6 border-t border-dark-border space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BookOpen className="text-indigo-400" size={20} />
                            Questions ({manualQuiz.questions.length})
                        </h3>
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={handleAddManualQuestion}
                            className="text-indigo-400 border-indigo-600/40 hover:bg-indigo-600/10 text-xs gap-1"
                        >
                            <Plus size={16} /> Add Question
                        </Button>
                    </div>

                    {manualQuiz.questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-5 bg-dark-bg border border-dark-border rounded-xl space-y-4 relative group">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                    Question {qIndex + 1}
                                </span>
                                {manualQuiz.questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveManualQuestion(qIndex)}
                                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors"
                                        title="Delete question"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div>
                                <input 
                                    type="text"
                                    required
                                    placeholder={`Enter Question ${qIndex + 1} text...`}
                                    className="w-full bg-dark-surface border border-dark-border rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={q.question}
                                    onChange={e => handleQuestionTextChange(qIndex, e.target.value)}
                                />
                            </div>

                            {/* 4 Options */}
                            <div className="space-y-2 pt-2">
                                <p className="text-xs font-semibold text-dark-muted uppercase">Options (Select radio button for Correct Answer)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2 bg-dark-surface border border-dark-border rounded-lg p-2.5">
                                            <input 
                                                type="radio"
                                                name={`correct_${qIndex}`}
                                                checked={q.correctAnswer === option && option !== ''}
                                                onChange={() => handleSelectCorrectAnswer(qIndex, option)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <input 
                                                type="text"
                                                required
                                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                className="w-full bg-transparent text-sm text-white outline-none"
                                                value={option}
                                                onChange={e => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {!q.correctAnswer && (
                                    <p className="text-xs text-amber-400 italic">⚠️ Please select which option is correct using the radio button.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-between border-t border-dark-border pt-6">
                    <Button 
                        type="button"
                        variant="outline"
                        onClick={handleAddManualQuestion}
                        className="text-indigo-400 border-indigo-600/40 hover:bg-indigo-600/10 text-xs gap-1"
                    >
                        <Plus size={16} /> Add Another Question
                    </Button>

                    <Button 
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-600/20"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {saving ? 'Publishing...' : 'Publish Academic Assessment'}
                    </Button>
                </div>

            </form>
        </Card>
    );
};

export default QuizCreator;
