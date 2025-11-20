import React from 'react';
import { GraduationCap, BarChart3 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-indigo-100" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">EduLytics AI</h1>
            <p className="text-xs text-indigo-200">Advanced School Data Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-1 text-sm bg-indigo-700/50 px-3 py-1 rounded-full">
              <BarChart3 className="h-4 w-4" />
              <span>Gemini 2.5 Flash Powered</span>
           </div>
        </div>
      </div>
    </header>
  );
};