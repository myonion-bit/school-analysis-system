
import React, { useState, useMemo } from 'react';
import { AnalysisResult, SubjectStats } from '../types';
import { Charts } from './Charts';
import { AIReport } from './AIReport';
import { generateInsight } from '../services/geminiService';
import { Users, Award, BookOpen, TrendingUp, AlertTriangle, Download, Filter, Check, List, Search, ArrowUpDown, ChevronDown, ChevronRight, BarChart2, LayoutDashboard, Trophy, Grip } from 'lucide-react';
import { calculateStats, getGrade, calculateClassStats, getMeanGrade } from '../utils/analytics';
import { KENYAN_GRADING_SYSTEM } from '../constants';

interface DashboardProps {
  analysis: AnalysisResult;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analysis, onReset }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'broadsheet' | 'streams'>('overview');
  
  // Filtering State
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(analysis.subjects);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  // Derive Filtered Data
  const currentAnalysis = useMemo(() => {
    const filteredRecords = selectedClass === 'All' 
      ? analysis.records 
      : analysis.records.filter(r => String(r[analysis.classColumn!]) === selectedClass);

    const stats = calculateStats(filteredRecords, analysis.subjects);

    return {
      ...analysis,
      records: filteredRecords,
      subjectStats: stats.subjectStats,
      globalStats: stats.globalStats,
      weakestStudents: stats.weakestStudents,
      topStudents: stats.topStudents
    };
  }, [analysis, selectedClass]);

  const displayedSubjectStats = useMemo(() => {
    return currentAnalysis.subjectStats.filter(s => selectedSubjects.includes(s.subject));
  }, [currentAnalysis, selectedSubjects]);

  // Calculate Class Comparisons for Charts (using global records to compare across streams, but respecting subject selection)
  const comparisonClassStats = useMemo(() => {
     return calculateClassStats(analysis.records, analysis.classes, analysis.classColumn, selectedSubjects);
  }, [analysis.records, analysis.classes, analysis.classColumn, selectedSubjects]);

  // Calculate Subject-Stream Matrix for Stream Analysis Tab
  const streamSubjectMatrix = useMemo(() => {
    if (!analysis.classColumn) return [];
    
    return analysis.subjects.map(subject => {
      const streamData: Record<string, { mean: number, points: number, grade: string }> = {};
      
      analysis.classes.forEach(cls => {
        const studentsInClass = analysis.records.filter(r => String(r[analysis.classColumn!]) === cls);
        const scores = studentsInClass
          .map(r => r[subject])
          .filter(s => typeof s === 'number');
        
        if (scores.length === 0) {
          streamData[cls] = { mean: 0, points: 0, grade: '-' };
        } else {
          const total = scores.reduce((a: number, b: number) => a + b, 0);
          const totalPoints = scores.reduce((a: number, b: number) => a + getGrade(b).points, 0);
          const mean = total / scores.length;
          const points = totalPoints / scores.length;
          streamData[cls] = { 
            mean, 
            points, 
            grade: getMeanGrade(points) 
          };
        }
      });

      return {
        subject,
        streams: streamData
      };
    });
  }, [analysis.records, analysis.subjects, analysis.classes, analysis.classColumn]);

  const handleGenerateAI = async () => {
    setLoadingAi(true);
    const report = await generateInsight(currentAnalysis);
    setAiReport(report);
    setLoadingAi(false);
  };

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(prev => prev.filter(s => s !== subject));
      }
    } else {
      setSelectedSubjects(prev => [...prev, subject]);
    }
  };

  const toggleRowExpansion = (index: number) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subValue && <p className="text-sm font-medium text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  // Helper to color code grades
  const getGradeColor = (grade: string) => {
    if (['A', 'A-'].includes(grade)) return 'text-green-600 bg-green-50 border-green-200';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const hasClasses = analysis.classes.length > 0;
  const allGrades = KENYAN_GRADING_SYSTEM.map(g => g.grade);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Exam Analysis Dashboard</h2>
           <p className="text-slate-500">
             Analyzing {currentAnalysis.records.length} candidates
             {selectedClass !== 'All' && <span className="font-semibold text-indigo-600 ml-1">• Stream: {selectedClass}</span>}
           </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            Upload New Exam
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          
          {/* Stream Filter */}
          {hasClasses && (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Filter className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Stream</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setAiReport(null);
                    setExpandedRowIndex(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                >
                  <option value="All">All Streams</option>
                  {analysis.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>

          {/* Subject Filter */}
          <div className="flex-1 w-full">
             <div className="flex items-center justify-between mb-2">
               <label className="text-xs font-medium text-slate-500">Subjects in View</label>
               <div className="flex gap-2">
                  <button onClick={() => setSelectedSubjects(analysis.subjects)} className="text-xs text-indigo-600 hover:underline">Select All</button>
                  <button onClick={() => setSelectedSubjects([])} className="text-xs text-slate-500 hover:underline">Clear</button>
               </div>
             </div>
             <div className="flex flex-wrap gap-2">
               {analysis.subjects.map(subject => {
                 const isSelected = selectedSubjects.includes(subject);
                 return (
                   <button
                     key={subject}
                     onClick={() => toggleSubject(subject)}
                     className={`
                       px-3 py-1 rounded-md text-xs font-medium border transition-all
                       ${isSelected 
                         ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                         : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}
                     `}
                   >
                     {subject}
                   </button>
                 );
               })}
             </div>
          </div>
        </div>
      </div>

      {/* Key Metrics (Kenyan Style: Mean Grade is King) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="School Mean Grade" 
          value={currentAnalysis.globalStats.meanGrade} 
          subValue={`Points: ${currentAnalysis.globalStats.meanPoints.toFixed(4)}`}
          icon={Award} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Mean Score (%)" 
          value={currentAnalysis.globalStats.meanScore.toFixed(2) + '%'} 
          icon={TrendingUp} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Top Subject" 
          value={currentAnalysis.globalStats.topPerformingSubject} 
          icon={BookOpen} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Candidates" 
          value={currentAnalysis.globalStats.totalStudents} 
          icon={Users} 
          color="bg-slate-500" 
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Overview
          </button>
          {hasClasses && (
            <button
              onClick={() => setActiveTab('streams')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'streams' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Stream Analysis
            </button>
          )}
          <button
            onClick={() => setActiveTab('broadsheet')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broadsheet' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
            Detailed Broadsheet
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
           
           {/* Top & Bottom Students */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" /> Top 5 Students
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                          <tr>
                             <th className="px-4 py-2">Rank</th>
                             <th className="px-4 py-2">Name</th>
                             <th className="px-4 py-2">Mean Grade</th>
                             <th className="px-4 py-2">Points</th>
                             <th className="px-4 py-2">Avg %</th>
                          </tr>
                       </thead>
                       <tbody>
                          {currentAnalysis.topStudents.map((s, i) => (
                             <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="px-4 py-3 font-mono text-slate-500">#{i+1}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                                <td className="px-4 py-3">
                                   <span className={`px-2 py-0.5 rounded border text-xs font-bold ${getGradeColor(s.meanGrade)}`}>
                                      {s.meanGrade}
                                   </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-indigo-600">{s.meanPoints.toFixed(2)}</td>
                                <td className="px-4 py-3 text-slate-600">{s.average}%</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" /> Trailing Students
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                          <tr>
                             <th className="px-4 py-2">Name</th>
                             <th className="px-4 py-2">Mean Grade</th>
                             <th className="px-4 py-2">Points</th>
                             <th className="px-4 py-2">Avg %</th>
                          </tr>
                       </thead>
                       <tbody>
                          {currentAnalysis.weakestStudents.map((s, i) => (
                             <tr key={i} className="border-b border-slate-100 last:border-0">
                                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                                <td className="px-4 py-3">
                                   <span className={`px-2 py-0.5 rounded border text-xs font-bold ${getGradeColor(s.meanGrade)}`}>
                                      {s.meanGrade}
                                   </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-600">{s.meanPoints.toFixed(2)}</td>
                                <td className="px-4 py-3 text-slate-600">{s.average}%</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
           
           {/* Subject Champions */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <h3 className="font-bold text-slate-800">Subject Champions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-slate-50/50">
                {analysis.subjectChampions.map(champ => (
                  <div key={champ.subject} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col">
                    <span className="text-xs font-bold uppercase text-slate-400 mb-1">{champ.subject}</span>
                    <span className="font-bold text-slate-800 truncate">{champ.name}</span>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-mono text-slate-500">{champ.adm}</span>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{champ.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Subject Grade Analysis Grid (The "Zeraki" Matrix) */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Grip className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Subject Grade Analysis</h3>
                 </div>
                 <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded">Counts per Grade</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-200 border-collapse">
                    <thead className="bg-slate-100">
                       <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200 sticky left-0 bg-slate-100 z-10">Subject</th>
                          {allGrades.map(g => (
                            <th key={g} className="px-2 py-2 text-center text-xs font-bold text-slate-600 border-r border-slate-200 min-w-[40px]">{g}</th>
                          ))}
                          <th className="px-4 py-2 text-center text-xs font-bold text-indigo-600 uppercase border-r border-slate-200">Points</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-indigo-600 uppercase">Mean</th>
                       </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                       {[...displayedSubjectStats].sort((a,b) => b.meanPoints - a.meanPoints).map((sub, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                             <td className="px-4 py-3 text-sm font-medium text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10">{sub.subject}</td>
                             {allGrades.map(g => {
                               const count = sub.gradeDistribution[g] || 0;
                               return (
                                 <td key={g} className={`px-2 py-2 text-center text-xs border-r border-slate-200 ${count > 0 ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>
                                   {count > 0 ? count : '-'}
                                 </td>
                               )
                             })}
                             <td className="px-4 py-3 text-sm text-center font-bold text-indigo-600 bg-indigo-50/30 border-r border-slate-200">{sub.meanPoints.toFixed(2)}</td>
                             <td className="px-4 py-3 text-sm text-center text-slate-600">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(sub.meanGrade)}`}>
                                   {sub.meanGrade}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           <Charts subjectStats={displayedSubjectStats} classStats={comparisonClassStats} />
           <AIReport report={aiReport} loading={loadingAi} onGenerate={handleGenerateAI} />

        </div>
      )}

      {activeTab === 'streams' && hasClasses && (
        <div className="space-y-8 animate-fade-in">
          {/* Stream Merit List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Stream Merit List</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Stream Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Entry</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mean Score</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mean Points</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mean Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Pass Rate</th>
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                     {[...comparisonClassStats]
                       .sort((a, b) => b.meanPoints - a.meanPoints)
                       .map((cls, idx) => (
                        <tr key={cls.className} className="hover:bg-slate-50">
                           <td className="px-6 py-4 text-sm font-medium text-slate-500">{idx + 1}</td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-900">{cls.className}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{cls.studentCount}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{cls.meanScore.toFixed(2)}%</td>
                           <td className="px-6 py-4 text-sm font-bold text-indigo-600">{cls.meanPoints.toFixed(2)}</td>
                           <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getGradeColor(cls.meanGrade)}`}>
                                 {cls.meanGrade}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-600">{cls.passRate}%</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>

          {/* Subject Performance Matrix by Stream */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Subject Performance by Stream</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200">Subject</th>
                        {analysis.classes.map(cls => (
                          <th key={cls} className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase border-r border-slate-200">
                            {cls}
                          </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                     {streamSubjectMatrix.map((row, idx) => (
                        <tr key={row.subject} className="hover:bg-slate-50">
                           <td className="px-6 py-4 text-sm font-medium text-slate-900 border-r border-slate-200 bg-slate-50/30">
                             {row.subject}
                           </td>
                           {analysis.classes.map(cls => {
                             const data = row.streams[cls];
                             return (
                               <td key={cls} className="px-4 py-4 text-center border-r border-slate-200">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-slate-800">{data.points.toFixed(2)}</span>
                                    <span className={`text-xs px-1.5 rounded border mt-1 ${getGradeColor(data.grade)}`}>
                                      {data.grade}
                                    </span>
                                  </div>
                               </td>
                             );
                           })}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadsheet' && (
        /* BROADSHEET VIEW */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
           <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
              <h3 className="font-bold text-slate-800">Class Broadsheet</h3>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Name or Adm No..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 min-w-[180px]">
                    <ArrowUpDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                      className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 w-full"
                    >
                      <option value="desc">Rank: Points (High-Low)</option>
                      <option value="asc">Rank: Points (Low-High)</option>
                    </select>
                </div>
              </div>
           </div>
           <div className="overflow-x-auto custom-scroll">
              <table className="min-w-full divide-y divide-slate-200 border-collapse">
                 <thead className="bg-slate-100">
                    <tr>
                       <th className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200 shadow-sm w-10"></th>
                       <th className="sticky left-10 z-10 bg-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200 shadow-sm min-w-[180px]">
                         Student Details
                       </th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase border-r border-slate-200 bg-slate-100">Rank</th>
                       {analysis.classColumn && <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase border-r border-slate-200">Stream</th>}
                       {analysis.subjects.map(sub => (
                          <th key={sub} className="px-2 py-3 text-center text-xs font-bold text-slate-600 uppercase border-r border-slate-200 min-w-[60px]">{sub.substring(0, 3)}</th>
                       ))}
                       <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase bg-indigo-50">Mean Pts</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase bg-slate-50">Mean %</th>
                       <th className="px-4 py-3 text-center text-xs font-bold text-indigo-700 uppercase bg-indigo-50">Grade</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-200">
                    {currentAnalysis.records
                      .filter(r => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        const nameKey = analysis.nameColumn || 'Name';
                        const name = String(r[nameKey] || '').toLowerCase();
                        const adm = analysis.admColumn ? String(r[analysis.admColumn]).toLowerCase() : '';
                        return name.includes(term) || adm.includes(term);
                      })
                      .map(r => {
                         const avg = typeof r.meanScore === 'number' ? r.meanScore : (r._avg || 0);
                         const mp = typeof r.meanPoints === 'number' ? r.meanPoints : (r._meanPoints || 0);
                         return { ...r, _avg: avg, _meanPoints: mp };
                      })
                      .sort((a, b) => {
                          if (sortOrder === 'desc') {
                             if (b._meanPoints !== a._meanPoints) return b._meanPoints - a._meanPoints;
                             return b._avg - a._avg;
                          } else {
                             if (a._meanPoints !== b._meanPoints) return a._meanPoints - b._meanPoints;
                             return a._avg - b._avg;
                          }
                      })
                      .map((row, idx) => {
                        const meanGrade = row.meanGrade || getGrade(row._avg).grade;
                        const admVal = analysis.admColumn ? row[analysis.admColumn] : '-';
                        const nameKey = analysis.nameColumn || 'Name';
                        const isExpanded = expandedRowIndex === idx;

                        return (
                         <React.Fragment key={idx}>
                           <tr 
                             className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
                             onClick={() => toggleRowExpansion(idx)}
                           >
                              <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-center border-r border-slate-200 shadow-sm">
                                 {isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                              </td>
                              <td className="sticky left-10 z-10 bg-inherit px-4 py-3 text-sm border-r border-slate-200 shadow-sm whitespace-nowrap group">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-mono text-slate-500">{admVal}</span>
                                    <span className="font-medium text-slate-900">{row[nameKey]}</span>
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-center border-r border-slate-200">
                                 <div className="flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-slate-800">#{row.overallRank}</span>
                                    {row.streamRank && <span className="text-[10px] text-slate-400">Str: #{row.streamRank}</span>}
                                 </div>
                              </td>
                              {analysis.classColumn && (
                                 <td className="px-4 py-3 text-xs text-slate-500 border-r border-slate-200 whitespace-nowrap">{row[analysis.classColumn]}</td>
                              )}
                              {analysis.subjects.map(sub => {
                                 const score = row[sub];
                                 const isNum = typeof score === 'number';
                                 const grade = isNum ? getGrade(score).grade : '-';
                                 return (
                                    <td key={sub} className="px-2 py-2 text-center border-r border-slate-200">
                                       <div className="flex flex-col items-center">
                                          <span className={`text-sm font-medium ${isNum && score < 50 ? 'text-red-500' : 'text-slate-700'}`}>{score}</span>
                                          <span className="text-[10px] text-slate-400">{grade}</span>
                                       </div>
                                    </td>
                                 );
                              })}
                              <td className="px-4 py-3 text-center text-sm font-bold text-indigo-600 bg-indigo-50/30">
                                 {row._meanPoints.toFixed(2)}
                              </td>
                               <td className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                                 {row._avg.toFixed(0)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getGradeColor(meanGrade)}`}>
                                    {meanGrade}
                                 </span>
                              </td>
                           </tr>
                           {isExpanded && (
                             <tr>
                               <td colSpan={100} className="bg-slate-50/50 p-4 shadow-inner">
                                 <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-5xl mx-auto">
                                    <div className="flex items-center gap-2 mb-3">
                                      <BarChart2 className="h-4 w-4 text-indigo-500" />
                                      <h4 className="text-sm font-bold text-slate-800">Student Grade Profile</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {KENYAN_GRADING_SYSTEM.map(g => {
                                        const count = row.gradeCounts ? row.gradeCounts[g.grade] || 0 : 0;
                                        const isNonZero = count > 0;
                                        return (
                                          <div 
                                            key={g.grade} 
                                            className={`flex flex-col items-center justify-center w-14 h-16 rounded border transition-all
                                              ${isNonZero 
                                                ? 'bg-white border-slate-300 shadow-sm' 
                                                : 'bg-slate-50 border-slate-100 opacity-50'
                                              }`}
                                          >
                                            <span className={`text-xs font-bold ${isNonZero ? 'text-slate-800' : 'text-slate-400'}`}>{g.grade}</span>
                                            <div className={`h-0.5 w-full my-1 ${isNonZero ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                            <span className={`text-lg font-bold leading-none ${isNonZero ? 'text-indigo-600' : 'text-slate-300'}`}>{count}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 italic">
                                      * Breakdown of total grades achieved across {analysis.subjects.length} subjects.
                                    </p>
                                 </div>
                               </td>
                             </tr>
                           )}
                         </React.Fragment>
                      )})}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};