import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { SAMPLE_DATA_CSV, MOCK_FILE_NAME } from '../constants';

interface FileUploadProps {
  onDataLoaded: (csvText: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file for this demo version.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onDataLoaded(text);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    onDataLoaded(SAMPLE_DATA_CSV);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Upload School Data</h2>
        <p className="text-slate-500 mt-2">
          Start your analysis by uploading a CSV file containing student scores and subject data.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
        `}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
          <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <span className="text-lg font-medium text-slate-700">Click to upload or drag and drop</span>
          <span className="text-sm text-slate-500 mt-1">CSV files only (max 5MB)</span>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm text-slate-500 mb-3">Don't have data ready?</p>
        <button
          onClick={loadSample}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Use Sample Dataset ({MOCK_FILE_NAME})
        </button>
      </div>
    </div>
  );
};