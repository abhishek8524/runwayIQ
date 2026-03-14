import { useCallback, useState, useRef } from 'react';

export default function UploadZone({ onFileSelect, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (!file.name.endsWith('.csv')) return 'Only CSV files are accepted';
    if (file.size > 10 * 1024 * 1024) return 'File must be under 10MB';
    return null;
  };

  const handleFile = useCallback(
    (file) => {
      const err = validateFile(file);
      if (err) {
        setError(err);
        setFileName(null);
        return;
      }
      setError(null);
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-10 h-10 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {fileName ? (
          <p className="text-sm font-medium text-primary">{fileName}</p>
        ) : (
          <>
            <p className="text-sm text-text-muted">
              <span className="font-medium text-primary">Click to browse</span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-text-muted">CSV files up to 10MB</p>
          </>
        )}
        {error && <p className="text-xs text-risk-high">{error}</p>}
      </div>
    </div>
  );
}
