import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Trash2, 
  ExternalLink, 
  User, 
  Building2, 
  Clock, 
  FileText, 
  Download,
  AlertOctagon,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { VerificationReport, RiskLevel } from '../types';
import { getRiskColor, formatDateTime, downloadJsonFile } from '../utils/complianceUtils';

interface HistoricalReportsListProps {
  reports: VerificationReport[];
  onSelectReport: (report: VerificationReport) => void;
  onDeleteReport: (reportId: string) => void;
  onClearAll: () => void;
}

export const HistoricalReportsList: React.FC<HistoricalReportsListProps> = ({
  reports,
  onSelectReport,
  onDeleteReport,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || r.riskAnalysis.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Archive className="w-4 h-4" />
            <span>Compliance Audit Vault</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Archived Screening Dossiers & Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Retained background verification records with timestamps, forensic indicators, and compliance decisions.
          </p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all archived reports?')) {
                onClearAll();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-red-950/50 border border-slate-800 hover:border-red-800/60 text-xs text-slate-400 hover:text-red-300 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Archive</span>
          </button>
        )}
      </div>

      {/* Search & Risk Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject name, country, or ID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Risk Tier:
          </span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Reports Grid / List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
          <Archive className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Historical Dossiers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run a screening on an individual or corporate entity to generate and archive official verification dossiers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const risk = getRiskColor(report.riskAnalysis.riskLevel);
            return (
              <div
                key={report.reportId}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    {report.subject.subjectType === 'individual' ? (
                      <User className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Building2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{report.subject.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                        {report.subject.subjectType === 'individual' ? 'Individual' : 'Entity'}
                      </span>
                      <span className="text-xs text-slate-400">{report.subject.jurisdiction}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>ID: <strong className="font-mono text-slate-300">{report.reportId}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(report.generatedAt)}
                      </span>
                      {report.officerSignature && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">Signed: {report.officerSignature}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Risk score, badges & Actions */}
                <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${risk.badgeBg} ${risk.badgeText} ${risk.borderColor}`}>
                        {report.riskAnalysis.riskLevel} ({report.riskAnalysis.compositeScore}/100)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {report.complianceRecommendation.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onSelectReport(report)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => {
                        const safeName = report.subject.name.replace(/[^a-zA-Z0-9]/g, '_');
                        downloadJsonFile(report, `VeritasScreen_${safeName}_${report.reportId}.json`);
                      }}
                      title="Download JSON"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteReport(report.reportId)}
                      title="Delete Report"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-500 hover:text-red-400 border border-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
