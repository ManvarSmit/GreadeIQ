import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import { quizAPI } from '../../services/api';
import { BookOpen, Clock, BrainCircuit, Play, AlertCircle } from 'lucide-react';

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await quizAPI.getAvailableQuizzes();
      setQuizzes(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setError('Failed to load available quizzes. Please try again.');
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/student/quiz/${quizId}`);
  };

  return (
    <PageWrapper>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Available Quizzes</h1>
            <p className="text-dark-muted text-lg">Test your knowledge and improve your grades.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-danger-500/10 text-danger-400 border border-danger-500/20">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-48 bg-dark-surface/50" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-dark-border bg-dark-surface/30">
            <div className="w-16 h-16 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center mb-4 text-dark-muted shadow-inner">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide">No Quizzes Available</h3>
            <p className="text-dark-muted max-w-md">You're all caught up! Check back later for new assignments from your counselors.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400 group-hover:scale-110 transition-transform duration-300">
                    <BrainCircuit size={24} />
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wider ${
                    quiz.difficulty === 'HARD' ? 'bg-danger-500/10 text-danger-400 border border-danger-500/20' :
                    quiz.difficulty === 'MEDIUM' ? 'bg-warning-500/10 text-warning-400 border border-warning-500/20' :
                    'bg-success-500/10 text-success-400 border border-success-500/20'
                  }`}>
                    {quiz.difficulty}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-primary-400 transition-colors">{quiz.title}</h3>
                <p className="text-sm text-dark-muted mb-6 line-clamp-2">{quiz.topics}</p>
                
                <div className="flex items-center gap-4 text-xs font-medium text-dark-muted mb-6 bg-dark-bg/60 p-3 rounded-xl border border-dark-border/50">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock size={14} className="text-primary-400" />
                    <span>{quiz.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <BookOpen size={14} className="text-primary-400" />
                    <span>{quiz._count?.questions || 0} Qs</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleStartQuiz(quiz.id)}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]"
                >
                  <Play size={18} className="fill-current" />
                  Start Quiz
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default StudentQuizzes;
