import PageWrapper from '../components/layout/PageWrapper';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import QuizCreator from '../components/quiz/QuizCreator';

const CounselorQuizzes = () => {
    return (
        <PageWrapper>
            <div className="animate-slide-in">
                <WelcomeBanner />

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-wide mb-2">Academic Assessment & Quiz Creator</h2>
                    <p className="text-dark-muted">Create and deploy course assessments with built-in anti-cheat proctoring.</p>
                </div>

                <div className="mt-8">
                    <QuizCreator onQuizCreated={(quiz) => console.log('Quiz successfully deployed:', quiz)} />
                </div>
            </div>
        </PageWrapper>
    );
};

export default CounselorQuizzes;
