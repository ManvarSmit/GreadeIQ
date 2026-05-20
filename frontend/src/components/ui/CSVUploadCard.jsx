import { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import Button from './Button';

const CSVUploadCard = ({
  title,
  description,
  uploadEndpoint,
  templateUrl,
  onUploadSuccess,
  icon: Icon = FileText
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadEndpoint(formData);

      setResult(response.data);
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (templateUrl) {
      const link = document.createElement('a');
      link.href = templateUrl;
      link.download = templateUrl.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-dark-border/60 overflow-hidden group">
      <div className="flex items-start gap-4 p-1">
        <div className="p-3 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-xl border border-indigo-100/50 shadow-sm group-hover:scale-105 transition-transform duration-300">
          <Icon className="text-indigo-600" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-secondary-500 mb-5 leading-relaxed">{description}</p>

          {/* Drag & Drop Zone */}
          <motion.div
            layout
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${dragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]'
                : file
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-dark-bg'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center gap-3"
                >
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <CheckCircle size={24} className="text-emerald-600" />
                  </div>
                  <span className="font-semibold text-white break-all px-4">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline mt-1"
                  >
                    Remove File
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-3 mx-auto w-12 h-12 bg-dark-surface rounded-full flex items-center justify-center">
                    <CloudUpload className="text-slate-400" size={24} />
                  </div>
                  <p className="text-sm text-dark-muted font-medium mb-1">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-slate-400">CSV files only</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`flex-1 shadow-md hover:shadow-lg transition-all ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload size={18} />
                  Upload Data
                </div>
              )}
            </Button>

            {templateUrl && (
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="px-4 text-dark-muted border-dark-border hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                title="Download Template"
              >
                <Download size={18} />
              </Button>
            )}
          </div>

          <AnimatePresence>
            {/* Success Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-emerald-900">Upload Complete</p>
                      <div className="mt-1 text-xs text-emerald-800 space-y-1 font-medium">
                        <p>Total Records: {result.total}</p>
                        <p>Imported: {result.imported}</p>
                        {result.errors > 0 && (
                          <p className="text-amber-700">Skipped/Errors: {result.errors}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-rose-900">Upload Failed</p>
                      <p className="text-xs text-rose-700 mt-1 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};

export default CSVUploadCard;
