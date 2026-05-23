import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import ExportButton from '../components/ui/ExportButton';
import { studentAPI, analyticsAPI } from '../services/api';
import { FileText, Users, AlertTriangle, PieChart, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
  const [students, setStudents] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, deptRes] = await Promise.all([
          studentAPI.getAll({ limit: 10000 }),
          analyticsAPI.getDepartmentRisk()
        ]);
        setStudents(studentsRes.data || []);
        setDepartmentData(deptRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const totalStudents = students.length;
  const highRisk = students.filter(s => s.dropoutRisk === 'HIGH').length;
  const mediumRisk = students.filter(s => s.dropoutRisk === 'MEDIUM').length;
  const lowRisk = students.filter(s => s.dropoutRisk === 'LOW').length;

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'High Risk', value: highRisk, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Medium Risk', value: mediumRisk, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Low Risk', value: lowRisk, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const reportTypes = [
    {
      title: 'Student List Report',
      description: 'Complete list of all students with their details',
      icon: Users,
      type: 'csv',
      reportType: 'students'
    },
    {
      title: 'Risk Analysis Report',
      description: 'Detailed breakdown of dropout risk by department',
      icon: AlertTriangle,
      type: 'pdf',
      reportType: 'department-risk'
    },
    {
      title: 'Admin Insights Report',
      description: 'Executive summary with key metrics and trends',
      icon: PieChart,
      type: 'pdf',
      reportType: 'admin-insights'
    }
  ];

  return (
    <PageWrapper
      title="Reports Center"
      subtitle="Generate and download comprehensive data reports"
    >
      <div className="space-y-8 animate-fade-in">

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="flex items-center p-6 hover:shadow-lg transition-transform hover:-translate-y-1 cursor-default border-t-4 border-t-transparent hover:border-t-indigo-500">
                <div className={`p-4 rounded-2xl ${stat.bg} mr-5`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-secondary-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Available Reports */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="text-indigo-500" /> Available Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportTypes.map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="p-6 h-full flex flex-col hover:shadow-xl transition-all border border-dark-border/60" hover>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-dark-bg rounded-xl border border-dark-border">
                      <report.icon className="text-dark-muted" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
                  <p className="text-sm text-secondary-500 mb-6 flex-grow">{report.description}</p>
                  <ExportButton type={report.type} reportType={report.reportType} className="w-full justify-center" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Department Breakdown */}
        {departmentData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Department Summary</h2>
            <div className="bg-dark-surface/80 backdrop-blur rounded-2xl border border-dark-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-dark-bg/50 border-b border-dark-border">
                      <th className="text-left py-4 px-6 text-sm font-semibold text-dark-muted">Department</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-dark-muted">Total Students</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-rose-500">High Risk</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-amber-500">Medium Risk</th>
                      <th className="text-center py-4 px-6 text-sm font-semibold text-emerald-500">Low Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {departmentData.map((dept, index) => (
                      <tr key={index} className="hover:bg-dark-bg/80 transition-colors">
                        <td className="py-4 px-6 font-medium text-white">{dept.department}</td>
                        <td className="py-4 px-6 text-center text-dark-muted font-medium">{dept.total}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {dept.high}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {dept.medium}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {dept.low}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Reports;
