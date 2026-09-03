import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  TrendingDown, 
  Archive, 
  Printer, 
  Download,
  AlertTriangle,
  Sparkles,
  Radio
} from 'lucide-react';
import { VerificationReport } from '../types';
import { downloadJsonFile } from '../utils/complianceUtils';

interface HeaderProps {
  activeTab: 'screening' | 'report' | 'sentiment' | 'vault' | 'monitoring';
  setActiveTab: (tab: 'screening' | 'report' | 'sentiment' | 'vault' | 'monitoring') => void;
  currentReport: VerificationReport | null;
  savedReportsCount: number;
  unacknowledgedAlertsCount?: number;
  onNewScreening: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentReport,
  savedReportsCount,
  unacknowledgedAlertsCount = 0,
  onNewScreening,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!currentReport) return;
    const safeName = currentReport.subject.name.replace(/[^a-zA-Z0-9]/g, '_');
    downloadJsonFile(currentReport, `VeritasScreen_${safeName}_${currentReport.reportId}.json`);
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('screening')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">VeritasScreen</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AML Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Adverse Media & ML/TF Background Verification Engine</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('screening')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'screening'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Screening Console</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              disabled={!currentReport}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : currentReport
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Verification Report</span>
              {currentReport && (
                <span className={`w-2 h-2 rounded-full ${
                  currentReport.riskAnalysis.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                  currentReport.riskAnalysis.riskLevel === 'HIGH' ? 'bg-orange-500' :
                  currentReport.riskAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              )}
            </button>

            <button
              onClick={() => setActiveTab('sentiment')}
              disabled={!currentReport}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hidden md:flex items-center gap-1.5 ${
                activeTab === 'sentiment'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : currentReport
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  : 'text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Adverse Sentiment</span>
            </button>

            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'monitoring'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Live News Radar</span>
              {unacknowledgedAlertsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                  {unacknowledgedAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'vault'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Audit Vault</span>
              {savedReportsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {savedReportsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            {currentReport && (
              <>
                <button
                  onClick={handlePrint}
                  title="Print / Save as PDF Official Dossier"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span className="hidden lg:inline">Print / PDF</span>
                </button>
                <button
                  onClick={handleExportJson}
                  title="Download JSON Report"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden lg:inline">JSON</span>
                </button>
              </>
            )}

            <button
              onClick={onNewScreening}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>New Screen</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
