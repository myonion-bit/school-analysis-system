import React from 'react';
import { Bot, RefreshCw, Sparkles, FileText } from 'lucide-react';

interface AIReportProps {
  report: string | null;
  loading: boolean;
  onGenerate: () => void;
}

export const AIReport: React.FC<AIReportProps> = ({ report, loading, onGenerate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Sparkles className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">AI Diagnostic & Improvement Plan</h3>
            <p className="text-sm text-slate-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            loading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing Data...
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              {report ? 'Regenerate Analysis' : 'Generate AI Report'}
            </>
          )}
        </button>
      </div>

      <div className="p-8 min-h-[300px] bg-slate-50/50">
        {!report && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <FileText className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">Click the button above to generate comprehensive insights.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse max-w-3xl mx-auto py-8">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-32 bg-slate-200 rounded w-full mt-6"></div>
          </div>
        )}

        {report && !loading && (
          <div className="prose prose-slate max-w-none">
            {/* Simple Markdown rendering */}
            {report.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold text-slate-800 mt-5 mb-2">{line.replace('### ', '')}</h3>;
              if (line.startsWith('- **')) {
                 const parts = line.split('**');
                 return <li key={i} className="ml-4 list-disc my-1 text-slate-700"><strong className="text-slate-900">{parts[1]}</strong>{parts[2]}</li>
              }
              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc my-1 text-slate-700">{line.replace('- ', '')}</li>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="text-slate-700 leading-relaxed mb-2">{line}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};