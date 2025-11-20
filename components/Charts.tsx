
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import { Download } from 'lucide-react';
import { SubjectStats, ClassStats } from '../types';
import { KENYAN_GRADING_SYSTEM } from '../constants';

interface ChartsProps {
  subjectStats: SubjectStats[];
  classStats: ClassStats[];
}

const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  // Filter out object types (like nested gradeDistribution) for clean CSV output
  const headers = Object.keys(data[0]).filter(key => 
    typeof data[0][key] !== 'object' && data[0][key] !== null && data[0][key] !== undefined
  );
  
  const csvRows = [
    headers.join(','),
    ...data.map(row => {
      return headers.map(header => {
        const val = row[header];
        // Escape quotes and handle commas
        const stringVal = String(val === undefined || val === null ? '' : val);
        return stringVal.includes(',') ? `"${stringVal}"` : stringVal;
      }).join(',');
    })
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const Charts: React.FC<ChartsProps> = ({ subjectStats, classStats }) => {
  
  // 1. Aggregate Grade Distribution (Total As, A-s, etc.)
  const allGrades = KENYAN_GRADING_SYSTEM.map(g => g.grade);
  const aggregatedGrades = allGrades.map(grade => {
    const count = subjectStats.reduce((acc, subj) => acc + (subj.gradeDistribution[grade] || 0), 0);
    return { grade, count };
  });

  // 2. Subject Mean Points Data
  const sortedByPoints = [...subjectStats].sort((a, b) => b.meanPoints - a.meanPoints);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Class Comparison Chart */}
      {classStats.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stream Comparison (Score vs Pass Rate)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="className" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" fontSize={12} tickLine={false} label={{ value: 'Mean Score %', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} tickLine={false} label={{ value: 'Pass Rate %', angle: 90, position: 'insideRight' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="meanScore" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Mean Score" barSize={32} />
                <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} name="Pass Rate" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => downloadCSV(classStats, 'stream_comparison.csv')}
              className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export Chart Data
            </button>
          </div>
        </div>
      )}

      {/* Grade Distribution (The "Zeraki" Curve) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Overall Grade Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aggregatedGrades}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="grade" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="No. of Students" barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={() => downloadCSV(aggregatedGrades, 'grade_distribution.csv')}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart Data
          </button>
        </div>
      </div>

      {/* Subject Ranking by Mean Points */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject Ranking (Mean Points)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedByPoints} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 12]} stroke="#64748b" fontSize={12} />
              <YAxis dataKey="subject" type="category" width={80} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="meanPoints" fill="#10b981" radius={[0, 4, 4, 0]} name="Mean Points (Max 12)" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={() => downloadCSV(sortedByPoints, 'subject_ranking_mean_points.csv')}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart Data
          </button>
        </div>
      </div>

      {/* Comparison of Mean Score vs Pass Rate */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject Performance Correlation</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={subjectStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#4f46e5" fontSize={12} tickLine={false} domain={[0, 100]} label={{ value: 'Mean Score %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} tickLine={false} domain={[0, 12]} label={{ value: 'Mean Points', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="mean" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} name="Mean Score %" />
              <Line yAxisId="right" type="monotone" dataKey="meanPoints" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Mean Points (12.0)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={() => downloadCSV(subjectStats, 'subject_correlation_stats.csv')}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Chart Data
          </button>
        </div>
      </div>

    </div>
  );
};
