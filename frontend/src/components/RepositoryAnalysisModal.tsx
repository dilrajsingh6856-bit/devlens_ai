import React, { useState } from 'react';
import { X, Copy, Check, FileCode, AlertTriangle, Lightbulb, FileText, BarChart2 } from 'lucide-react';

interface CodeSmell {
  file: string;
  line?: string;
  type: string;
  description: string;
  severity: string;
}

interface RefactorOpportunity {
  file: string;
  description: string;
  before_code?: string;
  after_code?: string;
  benefits: string;
}

interface AnalysisData {
  repo_name: string;
  summary: string;
  code_smells: CodeSmell[];
  refactoring_opportunities: RefactorOpportunity[];
  code_complexity: string;
  documentation: string;
  recommendations: string[];
  unused_or_duplicate_code?: string;
}

interface RepositoryAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysis: AnalysisData | null;
}

export const RepositoryAnalysisModal: React.FC<RepositoryAnalysisModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  analysis,
}) => {
  const [activeTab, setActiveTab] = useState<'smells' | 'refactor' | 'docs' | 'metrics'>('smells');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDocs = () => {
    if (analysis?.documentation) {
      navigator.clipboard.writeText(analysis.documentation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl max-h-[85vh] flex flex-col text-left overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center space-x-2">
            <FileCode className="text-primary-400" size={20} />
            <h2 className="text-lg font-bold text-white">
              {isLoading ? "Analyzing Repository..." : `${analysis?.repo_name} Code Analysis`}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <p className="text-sm text-zinc-300 font-semibold">Running DevLens Static Analyzer...</p>
              <p className="text-xs text-zinc-500">Checking complexity, code structures, and refactoring possibilities.</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && analysis && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0e]">
            {/* Summary Banner */}
            <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-900">
              <p className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-1">Project Summary</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Tabs Row */}
            <div className="flex px-6 border-b border-zinc-800 bg-zinc-950 text-sm">
              <button
                onClick={() => setActiveTab('smells')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'smells' 
                    ? 'border-primary-500 text-primary-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <AlertTriangle size={16} />
                <span>Code Smells ({analysis.code_smells.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('refactor')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'refactor' 
                    ? 'border-primary-500 text-primary-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Lightbulb size={16} />
                <span>Refactoring ({analysis.refactoring_opportunities.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'docs' 
                    ? 'border-primary-500 text-primary-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText size={16} />
                <span>Auto-Docs</span>
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'metrics' 
                    ? 'border-primary-500 text-primary-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart2 size={16} />
                <span>Complexity & Rules</span>
              </button>
            </div>

            {/* Tab panel body */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              
              {/* CODE SMELLS TAB */}
              {activeTab === 'smells' && (
                <div className="space-y-4">
                  {analysis.code_smells.length === 0 ? (
                    <div className="text-zinc-500 text-sm py-4">No major code smells detected! Excellent clean code quality.</div>
                  ) : (
                    analysis.code_smells.map((smell, idx) => {
                      const sevColors = smell.severity.toLowerCase() === 'high' 
                        ? 'bg-red-950 text-red-400 border-red-900' 
                        : smell.severity.toLowerCase() === 'medium'
                        ? 'bg-amber-950 text-amber-400 border-amber-900'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700';

                      return (
                        <div key={idx} className="bg-zinc-900 bg-opacity-40 border border-zinc-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-xs text-primary-300 font-mono block">{smell.file} {smell.line ? `(${smell.line})` : ''}</span>
                              <h4 className="text-sm font-semibold text-white">{smell.type}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${sevColors}`}>
                              {smell.severity}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{smell.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* REFACTORING OPPORTUNITIES TAB */}
              {activeTab === 'refactor' && (
                <div className="space-y-6">
                  {analysis.refactoring_opportunities.length === 0 ? (
                    <div className="text-zinc-500 text-sm py-4">No refactoring opportunities proposed.</div>
                  ) : (
                    analysis.refactoring_opportunities.map((opp, idx) => (
                      <div key={idx} className="bg-zinc-900 bg-opacity-40 border border-zinc-800 rounded-lg p-4 space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs text-primary-300 font-mono block">{opp.file}</span>
                          <h4 className="text-sm font-semibold text-white">{opp.description}</h4>
                          <p className="text-xs text-emerald-400 font-medium">Benefits: {opp.benefits}</p>
                        </div>

                        {opp.before_code && opp.after_code && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {/* Before */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Before</span>
                              <pre className="bg-red-950 bg-opacity-20 border border-red-900 border-opacity-45 rounded-lg p-3 text-red-300 overflow-x-auto max-h-48 text-[11px] leading-relaxed">
                                {opp.before_code}
                              </pre>
                            </div>
                            {/* After */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">After (Proposed)</span>
                              <pre className="bg-emerald-950 bg-opacity-20 border border-emerald-900 border-opacity-45 rounded-lg p-3 text-emerald-300 overflow-x-auto max-h-48 text-[11px] leading-relaxed">
                                {opp.after_code}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* DOCUMENTATION TAB */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Auto-generated Markdown Documentation (README.md suggestion)</span>
                    <button
                      onClick={handleCopyDocs}
                      className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300 font-semibold transition-colors"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? "Copied!" : "Copy markdown"}</span>
                    </button>
                  </div>
                  <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 font-mono overflow-x-auto max-h-[45vh] whitespace-pre-wrap leading-relaxed">
                    {analysis.documentation}
                  </pre>
                </div>
              )}

              {/* METRICS & RECOMMENDATIONS TAB */}
              {activeTab === 'metrics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Complexity */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="glass-card p-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Complexity Profile</h4>
                      <p className="text-xs text-zinc-300 leading-normal">{analysis.code_complexity}</p>
                    </div>

                    {analysis.unused_or_duplicate_code && (
                      <div className="glass-card p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Duplications & Unused Code</h4>
                        <p className="text-xs text-zinc-300 leading-normal">{analysis.unused_or_duplicate_code}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Recommendations */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">AI Quality Recommendations</h4>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-zinc-400 bg-zinc-900 bg-opacity-30 border border-zinc-850 p-3 rounded-lg leading-relaxed">
                          <span className="flex items-center justify-center bg-primary-950 border border-primary-900 text-primary-400 font-bold rounded-full w-5 h-5 text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
