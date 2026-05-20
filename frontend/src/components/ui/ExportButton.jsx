import { Download, FileText } from 'lucide-react';
import Button from './Button';
import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

const ExportButton = ({ type = 'csv', reportType, filters, onExport, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const { success, error: toastError } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const exportData = {
        type: reportType,
        filters: filters || {}
      };

      const endpoint = type === 'pdf' ? '/analytics/export-pdf' : '/analytics/export-csv';
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const fileResponse = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(exportData)
      });

      if (!fileResponse.ok) {
        throw new Error('Export failed');
      }

      const blob = await fileResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExport?.();
      success(`${reportType} report exported successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toastError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant={type === 'pdf' ? 'primary' : 'secondary'}
      className={className}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          {type === 'pdf' ? <FileText size={18} /> : <Download size={18} />}
          <span>Export {type.toUpperCase()}</span>
        </>
      )}
    </Button>
  );
};

export default ExportButton;
