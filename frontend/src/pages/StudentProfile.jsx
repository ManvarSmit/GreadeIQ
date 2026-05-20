import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import { studentAPI, counselingAPI, aiAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

// New Modular Components
import ProfileHeader from '../components/student/ProfileHeader';
import RiskAnalysisCard from '../components/student/RiskAnalysisCard';
import AcademicCharts from '../components/student/AcademicCharts';
import MentorshipCard from '../components/student/MentorshipCard';
import AIGuidanceCard from '../components/student/AIGuidanceCard';
import CounselingTimeline from '../components/student/CounselingTimeline';
import EditStudentModal from '../components/modals/EditStudentModal';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { user } = useAuth();

  // State
  const [student, setStudent] = useState(null);
  const [counselingHistory, setCounselingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [improvementPlan, setImprovementPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [assigningMentor, setAssigningMentor] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const studentResponse = await studentAPI.getById(id);
      setStudent(studentResponse.data || studentResponse);

      try {
        const counselingResponse = await counselingAPI.getByStudent(id);
        setCounselingHistory(counselingResponse.data || counselingResponse);
      } catch (error) {
        console.log('No counseling history found');
        setCounselingHistory([]);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toastError('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm('Are you sure? This action is irreversible.')) return;
    try {
      await studentAPI.delete(id);
      success('Student deleted successfully');
      navigate('/students');
    } catch (err) {
      toastError(err.message || 'Failed to delete student');
    }
  };

  const generateImprovementPlan = async () => {
    try {
      setLoadingPlan(true);
      const response = await aiAPI.getImprovementPlan(id);
      setImprovementPlan(response.data);
      success('AI Guidance generated successfully!');
    } catch (err) {
      console.error('AI Plan Error:', err);
      toastError('Failed to generate improvement plan');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAssigningMentor(true);
      const response = await aiAPI.autoAssignMentor(id);
      success(`Assigned to ${response.data.mentorName || 'Mentor'} successfully!`);
      fetchStudentData();
    } catch (err) {
      toastError(err.message || 'Failed to auto-assign mentor');
    } finally {
      setAssigningMentor(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!student) return <PageWrapper>Student not found</PageWrapper>;

  return (
    <PageWrapper
      title={
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Back to Directory
        </button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

        {/* 1. Header Section */}
        <ProfileHeader
          student={student}
          onEdit={() => setShowEditModal(true)}
          onDelete={handleDeleteStudent}
        />

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Risk & Mentorship */}
          <div className="space-y-6">
            <RiskAnalysisCard student={student} />
            <MentorshipCard
              student={student}
              onAssign={handleAutoAssign}
              assigning={assigningMentor}
            />
          </div>

          {/* Right Column: Charts & AI Guidance */}
          <div className="lg:col-span-2 space-y-6">
            <AcademicCharts student={student} />
            <AIGuidanceCard
              plan={improvementPlan}
              onGenerate={generateImprovementPlan}
              loading={loadingPlan}
            />
          </div>
        </div>

        {/* 3. Timeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <CounselingTimeline history={counselingHistory} />
          </div>
        </div>

      </div>

      <EditStudentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchStudentData}
        student={student}
      />
    </PageWrapper>
  );
};

export default StudentProfile;
