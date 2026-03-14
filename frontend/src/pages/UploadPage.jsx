import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import {
  uploadTransactions,
  computeMetrics,
  generateReport,
  setBusinessId,
} from '../api/client';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processUpload = async (businessId, skipUpload = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!skipUpload && file) {
        const res = await uploadTransactions(file);
        businessId = res.data.businessId ?? businessId;
      }
      await computeMetrics(businessId);
      await generateReport(businessId);
      setBusinessId(businessId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    processUpload(null);
  };

  const handleDemo = () => {
    processUpload('acme-corp-id', true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-sm border border-border p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-semibold text-text">RunwayIQ</h1>
          <p className="text-sm text-text-muted mt-1">Upload Financial Data</p>
        </div>

        <UploadZone onFileSelect={setFile} disabled={loading} />

        {error && (
          <div className="mt-4 p-3 bg-risk-high/10 border border-risk-high/20 rounded-lg">
            <p className="text-sm text-risk-high">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-6 w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Upload & Analyze'
          )}
        </button>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          className="mt-4 w-full py-2.5 px-4 border border-border text-text rounded-lg font-medium text-sm hover:bg-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use Demo Data
        </button>
      </div>
    </div>
  );
}
