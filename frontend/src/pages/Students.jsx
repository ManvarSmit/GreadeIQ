import { useState, useEffect } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  Search, Filter, Eye,
  ChevronLeft, ChevronRight, CheckSquare, Square,
  ArrowUpDown, User, Mail, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';
import AddStudentModal from '../components/modals/AddStudentModal';
import ExportButton from '../components/ui/ExportButton';

const Students = () => {
  const { error, info } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);

  // Data State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [itemsPerPage] = useState(10);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterRisk, setFilterRisk] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [departments, setDepartments] = useState([]);

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Initial Data Fetch (Departments)
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch Students on Filter/Page Change
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterRisk, filterDept, currentPage]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await studentAPI.getStats();
      if (response.data && response.data.byDepartment) {
        const depts = response.data.byDepartment.map(d => d.department).filter(Boolean);
        setDepartments(depts);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        dropoutRisk: filterRisk || undefined,
        department: filterDept || undefined
      };

      const response = await studentAPI.getAll(params);

      if (response.success) {
        setStudents(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalStudents(response.pagination.total);
        setCurrentPage(response.pagination.page); // Sync with backend response
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(students.map(s => s.id));
      setSelectedIds(newSelected);
    }
  };

  const getRiskBadge = (level) => {
    const variants = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success', UNKNOWN: 'neutral' };
    return <Badge variant={variants[level || 'UNKNOWN']}>{level || 'UNKNOWN'}</Badge>;
  };

  return (
    <PageWrapper title="Students Directory">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Students</h1>
          <p className="text-dark-muted">Manage and monitor student performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchStudents} className="bg-white border-dark-border text-dark-muted hover:bg-dark-bg" title="Refresh Data">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <ExportButton
            type="csv"
            reportType="students"
            filters={{
              department: filterDept || undefined,
              riskLevel: filterRisk || undefined
            }}
            className="bg-white border-dark-border text-dark-muted hover:bg-dark-bg shadow-none"
          />
          <Button
            className="shadow-lg shadow-primary-500/20"
            onClick={() => setShowAddModal(true)}
          >
            <User size={18} className="mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="mb-6 border-dark-border shadow-lg sticky top-24 z-10 backdrop-blur-md bg-dark-surface/90">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">

          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange({ target: { value: '' } })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-dark-muted"
              >
                ×
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-dark-bg px-3 py-2 rounded-lg border border-dark-border">
              <Filter size={16} className="text-dark-muted" />
              <select
                value={filterDept}
                onChange={(e) => handleFilterChange(setFilterDept, e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-dark-muted focus:outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-dark-bg px-3 py-2 rounded-lg border border-dark-border">
              <span className={`w-2 h-2 rounded-full ${filterRisk === 'HIGH' ? 'bg-rose-500' : filterRisk === 'MEDIUM' ? 'bg-amber-500' : filterRisk === 'LOW' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <select
                value={filterRisk}
                onChange={(e) => handleFilterChange(setFilterRisk, e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-dark-muted focus:outline-none cursor-pointer"
              >
                <option value="">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-6 z-50 animate-slide-up">
          <span className="font-semibold">{selectedIds.size} Selected</span>
          <div className="h-4 w-[1px] bg-slate-600"></div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => info('Assign mentors from Admin Dashboard → User Management.')}
              className="hover:text-primary-300 transition-colors text-sm font-medium"
            >
              Assign Mentor
            </button>
            <button
              type="button"
              onClick={() => info('Open a student profile to review risk and interventions.')}
              className="hover:text-rose-300 transition-colors text-sm font-medium"
            >
              Flag Risk
            </button>
            <button
              type="button"
              onClick={() => info('Use Export CSV in the header to download the student list.')}
              className="hover:text-slate-300 transition-colors text-sm font-medium"
            >
              Export
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-2 p-1 hover:bg-white/10 rounded-full"
          >
            <ChevronLeft size={16} className="rotate-[-90deg]" />
          </button>
        </div>
      )}

      {/* Data Table */}
      <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-100">
        <div className="overflow-x-auto min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-secondary-500 animate-pulse">Loading students...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-dark-bg/80 border-b border-dark-border">
                <tr>
                  <th className="w-12 px-6 py-4">
                    <button onClick={toggleAll} className="text-slate-400 hover:text-primary-600">
                      {selectedIds.size === students.length && students.length > 0 ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-dark-muted uppercase tracking-wider cursor-pointer group hover:text-primary-600">
                    <div className="flex items-center gap-1">Student <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" /></div>
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-dark-muted uppercase tracking-wider">Dept & ID</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-dark-muted uppercase tracking-wider">Performance</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-dark-muted uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-dark-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const isSelected = selectedIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-all duration-200 group ${isSelected ? 'bg-primary-50/40' : 'hover:bg-dark-bg'}`}
                    >
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelection(student.id)} className={`transition-colors ${isSelected ? 'text-primary-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-white border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm font-mono">
                            {student.name.charAt(0)}{student.name.split(' ')[1]?.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isSelected ? 'text-primary-800' : 'text-white'}`}>{student.name}</p>
                            <p className="text-xs text-dark-muted flex items-center gap-1">
                              <Mail size={10} className="inline" /> {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-dark-muted">{student.department || 'N/A'}</span>
                          <span className="text-xs text-dark-muted font-mono">{student.studentId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5 max-w-[120px] mx-auto">
                          <div className="flex justify-between text-xs">
                            <span className="text-dark-muted">Attendance</span>
                            <span className={`font-bold ${student.attendancePercent < 75 ? 'text-rose-600' : 'text-dark-muted'}`}>
                              {Math.round(student.attendancePercent || 0)}%
                            </span>
                          </div>
                          <div className="w-full bg-dark-surface rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${student.attendancePercent < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${student.attendancePercent || 0}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-0.5">
                            <span className="text-dark-muted">CGPA</span>
                            <span className="font-bold text-dark-muted">{(student.currentCGPA || 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getRiskBadge(student.dropoutRisk)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/students/${student.id}`}
                            className="p-2 bg-dark-surface border border-dark-border rounded-lg text-dark-muted hover:text-primary-400 hover:border-primary-500/50 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search size={48} className="mb-4 text-slate-200" />
                        <p className="text-lg font-medium text-dark-muted">No students found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-dark-border bg-dark-bg flex items-center justify-between">
          <p className="text-sm text-dark-muted">
            Showing <span className="font-bold text-dark-muted">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-dark-muted">{Math.min(currentPage * itemsPerPage, totalStudents)}</span> of <span className="font-bold text-dark-muted">{totalStudents}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 h-8 text-xs"
            >
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 h-8 text-xs"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchStudents();
          fetchStats();
        }}
      />
    </PageWrapper>
  );
};

export default Students;
