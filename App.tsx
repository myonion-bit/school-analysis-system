import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseCSV, analyzeData } from './utils/analytics';
import { AnalysisResult, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDataLoaded = (csvText: string) => {
    try {
      setAppState(AppState.PROCESSING);
      setError(null);
      
      // Simulate a small delay for UX to show processing state if dataset is large
      setTimeout(() => {
        try {
          const rawData = parseCSV(csvText);
          const result = analyzeData(rawData);
          setAnalysisResult(result);
          setAppState(AppState.DASHBOARD);
        } catch (err) {
          console.error(err);
          setError("Failed to analyze data. Please ensure the CSV format is correct.");
          setAppState(AppState.UPLOAD);
        }
      }, 800);
      
    } catch (err) {
      setError("Error parsing file.");
      setAppState(AppState.UPLOAD);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAppState(AppState.UPLOAD);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {appState === AppState.UPLOAD && (
          <div className="animate-fade-in">
            <FileUpload onDataLoaded={handleDataLoaded} />
            {error && (
               <div className="max-w-lg mx-auto mt-4 p-4 bg-red-100 text-red-700 rounded-md text-center">
                 {error}
               </div>
            )}
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-700">Processing Data...</h2>
            <p className="text-slate-500">Calculating statistics and normalizing scores</p>
          </div>
        )}

        {appState === AppState.DASHBOARD && analysisResult && (
          <Dashboard 
            analysis={analysisResult} 
            onReset={handleReset} 
          />
        )}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} EduLytics AI. Built for Educational Excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;