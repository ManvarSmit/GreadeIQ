import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { analyticsAPI, studentAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

// New Modular Components
import AnalyticsHeader from '../components/analytics/AnalyticsHeader';
import KPIStats from '../components/analytics/KPIStats';
import DepartmentRiskChart from '../components/analytics/DepartmentRiskChart';
import SemesterTrendChart from '../components/analytics/SemesterTrendChart';
import SubjectHeatmap from '../components/analytics/SubjectHeatmap';

const Analytics = () => {
  const { error: toastError } = useToast();

  // Data states
  const [departmentRisk, setDepartmentRisk] = useState([]);
  const [subjectFailures, setSubjectFailures] = useState([]);
  const [semesterTransition, setSemesterTransition] = useState([]);
  const [stats, setStats] = useState({
    successRate: 0,
    dropoutRate: 0,
    activeInterventions: 0,
    highRiskStudents: 0
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSemester]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = selectedSemester ? { semester: selectedSemester } : {};

      // Fetch all analytics data
      const [deptData, subjData, semData, studentsResponse] = await Promise.all([
        analyticsAPI.getDepartmentRisk(params),
        analyticsAPI.getSubjectFailures(),
        analyticsAPI.getSemesterTransition(),
        studentAPI.getAll({ limit: 1000 })
      ]);

      setDepartmentRisk(deptData.data || []);
      setSubjectFailures(subjData.data || []);
      setSemesterTransition(semData.data || []);

      // Calculate stats
      const students = studentsResponse.data || [];
      const totalStudents = students.length;
      const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
      const lowRisk = students.filter(s => s.dropoutRisk === 'LOW' || !s.dropoutRisk).length;

      setStats({
        successRate: totalStudents > 0 ? ((lowRisk / totalStudents) * 100).toFixed(1) : 0,
        dropoutRate: totalStudents > 0 ? ((highRisk / totalStudents) * 100).toFixed(1) : 0,
        activeInterventions: Math.floor(highRisk * 0.4), // Mocked for now
        highRiskStudents: highRisk
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toastError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    console.log(`Exporting ${type}...`);
    // Placeholder for export functionality
  };

  if (loading && departmentRisk.length === 0) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">

        {/* Header & Controls */}
        <AnalyticsHeader
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          semesters={semesters}
          onExport={handleExport}
        />

        {/* High-Level Stats */}
        <KPIStats stats={stats} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Department Risk Analysis */}
          <div className="lg:col-span-1">
            <DepartmentRiskChart data={departmentRisk} />
          </div>

          {/* Trend Analysis */}
          <div className="lg:col-span-1">
            <SemesterTrendChart data={semesterTransition} />
          </div>

          {/* Full Width Heatmap */}
          <div className="lg:col-span-2">
            <SubjectHeatmap data={subjectFailures} />
          </div>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
