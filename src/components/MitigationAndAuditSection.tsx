import React, { useState } from 'react';
import { 
  CheckSquare, 
  History, 
  Lock, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { VerificationReport, AuditLogItem } from '../types';
import { formatDateTime } from '../utils/complianceUtils';

interface MitigationAndAuditSectionProps {
  report: VerificationReport;
  onUpdateReport: (updated: VerificationReport) => void;
  isSignOffOpen: boolean;
  setIsSignOffOpen: (open: boolean) => void;
}

export const MitigationAndAuditSection: React.FC<MitigationAndAuditSectionProps> = ({
  report,
  onUpdateReport,
  isSignOffOpen,
  setIsSignOffOpen,
}) => {
  const [officerName, setOfficerName] = useState(report.officerSignature || '');
  const [officerDecision, setOfficerDecision] = useState(report.complianceRecommendation);
  const [officerNotes, setOfficerNotes] = useState(report.officerNotes || '');

  const handleSaveSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) return;

    const newAuditItem: AuditLogItem = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Officer Sign-Off Completed: Decision Set to ${officerDecision}`,
      actor: officerName.trim(),
      note: officerNotes.trim() || 'No additional notes provided.',
    };

    const updated: VerificationReport = {
      ...report,
      complianceRecommendation: officerDecision,
      officerSignature: officerName.trim(),
      officerNotes: officerNotes.trim(),
      officerDecision,
      status: officerDecision === 'REJECT_BLOCK' ? 'BLOCKED' : 'APPROVED',
      auditTrail: [newAuditItem, ...report.auditTrail],
    };

    onUpdateReport(updated);
    setIsSignOffOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Recommended Risk Mitigation Steps (7 Cols) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommended Risk Mitigation Actions
            </h3>
          </div>
          <span className="text-xs text-slate-400">Standard Operating Procedures</span>
        </div>

        <div className="space-y-2.5">
          {report.recommendedMitigationSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60 shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Officer Review Callout */}
        <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Compliance Officer Attestation</span>
            </span>
            <button
              onClick={() => setIsSignOffOpen(true)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
            >
              {report.officerSignature ? 'Update Sign-off' : 'Sign Off Dossier'}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            {report.officerSignature ? (
              <span>
                Verified and certified by <strong className="text-white">{report.officerSignature}</strong> on{' '}
                <span className="text-slate-400">{formatDateTime(report.generatedAt)}</span>. Notes:{' '}
                <em>"{report.officerNotes || 'None'}"</em>
              </span>
            ) : (
              'This screening dossier requires formal compliance adjudication. Review the adverse media evidence and sanctions checks above before finalizing disposition.'
            )}
          </p>
        </div>
      </div>

      {/* Immutable Verification Audit Trail (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dossier Audit Trail & Digital Seal
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">SHA-256 Validated</span>
        </div>

        {/* Digital Seal Box */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Verification Hash:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Integrity Secured
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
            {report.verificationHash}
          </div>
        </div>

        {/* Timeline Log */}
        <div className="space-y-3 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Activity Log:
          </span>
          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {report.auditTrail.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-indigo-300">{log.actor}</span>
                  <span className="text-slate-500 font-mono">{formatDateTime(log.timestamp)}</span>
                </div>
                <div className="font-medium text-slate-200">{log.action}</div>
                {log.note && <div className="text-slate-400 italic text-[11px]">{log.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Compliance Sign-Off */}
      {isSignOffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Compliance Officer Adjudication</h3>
              </div>
              <button
                onClick={() => setIsSignOffOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSignOff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Compliance Officer / Reviewer Name *</label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g., Sarah Chen, CAMS, Senior Compliance Analyst"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Final Compliance Disposition Override</label>
                <select
                  value={officerDecision}
                  onChange={(e) => setOfficerDecision(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="PASS">STANDARD APPROVAL (PASS)</option>
                  <option value="PASS_WITH_MONITORING">PASS WITH CONDITIONAL MONITORING</option>
                  <option value="ENHANCED_DUE_DILIGENCE">ENHANCED DUE DILIGENCE (EDD)</option>
                  <option value="REJECT_BLOCK">PROHIBITED / REJECT & BLOCK</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Adjudication Rationale & Internal File Notes</label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter detailed compliance rationale for onboarding committee..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignOffOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow transition"
                >
                  Confirm & Seal Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
