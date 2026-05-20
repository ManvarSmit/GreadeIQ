import { useState } from 'react';
import { Sparkles, Save, BookOpen, Clock, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { aiAPI, quizAPI } from '../../services/api';

const QuizCreator = ({ onQuizCreated }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        topics: '',
        difficulty: 'intermediate',
        numQuestions: 5,
        durationMinutes: 30
    });
    const [generatedQuiz, setGeneratedQuiz] = useState(null);

    const handleGenerate = async () => {
        if (!formData.title || !formData.topics) return alert('Title and Topics are required.');
        setLoading(true);
        try {
            const response = await aiAPI.generateQuiz({
                topics: formData.topics,
                difficulty: formData.difficulty,
                numQuestions: formData.numQuestions
            });
            
            // The AI returns a structured JSON parsing format, we attach title & duration
            setGeneratedQuiz({
                title: formData.title,
                description: `A generated quiz focusing on ${formData.topics}.`,
                topics: formData.topics,
                durationMinutes: formData.durationMinutes,
                difficulty: formData.difficulty,
                questions: response.data || []
            });
        } catch (error) {
            console.error('Failed to generate quiz:', error);
            alert('Failed to generate quiz. Check your connection to Gemini API.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!generatedQuiz || !generatedQuiz.questions.length) return;
        setSaving(true);
        try {
            const res = await quizAPI.createQuiz(generatedQuiz);
            alert('Quiz saved successfully!');
            setGeneratedQuiz(null);
            if (onQuizCreated) onQuizCreated(res.data);
        } catch (err) {
            console.error('Failed to save quiz', err);
            alert('Failed to save quiz.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto border-primary-500/20 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 border-b border-dark-border pb-6 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl border border-primary-500/20">
                    <Sparkles className="text-primary-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">AI Quiz Generator</h2>
                    <p className="text-sm text-dark-muted">Create anti-cheat enabled assessments in seconds.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">Quiz Title</label>
                    <input 
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                        placeholder="e.g. Midterm Assessment: Data Structures"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">Target Topics</label>
                    <input 
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                        placeholder="e.g. Trees, Graphs, Hash Maps"
                        value={formData.topics}
                        onChange={e => setFormData({ ...formData, topics: e.target.value })}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-dark-muted mb-2">Difficulty</label>
                        <select 
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            value={formData.difficulty}
                            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-medium text-dark-muted mb-2">Count</label>
                        <input 
                            type="number"
                            className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            value={formData.numQuestions}
                            onChange={e => setFormData({ ...formData, numQuestions: parseInt(e.target.value) || 5 })}
                            min="1" max="50"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">Duration (Minutes)</label>
                    <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={18} />
                        <input 
                            type="number"
                            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                            value={formData.durationMinutes}
                            onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })}
                            min="5" max="180"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-dark-border pt-6">
                <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border-none"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles className="mr-2" size={18} />}
                    {loading ? 'Generating with Gemini API...' : 'Generate Questions'}
                </Button>
            </div>

            {/* Preview Section */}
            {generatedQuiz && (
                <div className="mt-10 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BookOpen className="text-primary-400" size={20} />
                            Preview: {generatedQuiz.questions.length} Questions Generated
                        </h3>
                        <Button onClick={handleSave} disabled={saving} variant="success" className="shadow-lg shadow-success-500/20">
                            {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                            Publish Quiz
                        </Button>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {generatedQuiz.questions.map((q, idx) => (
                            <div key={idx} className="p-5 bg-dark-bg/50 border border-dark-border rounded-xl transition-all hover:bg-white/5">
                                <p className="font-medium text-white mb-4">
                                    <span className="text-primary-400 mr-2">Q{idx + 1}.</span> 
                                    {q.question}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`p-3 rounded-lg border text-sm ${opt === q.correctAnswer ? 'bg-success-500/10 border-success-500/30 text-success-300' : 'bg-dark-surface border-dark-border text-dark-muted'}`}>
                                            {opt}
                                            {opt === q.correctAnswer && <span className="float-right text-success-400 font-bold">✓ Correct</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default QuizCreator;
