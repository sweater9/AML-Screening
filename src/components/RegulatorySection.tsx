import React from 'react';
import { 
  Gavel, 
  ExternalLink, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Building 
} from 'lucide-react';
import { RegulatoryAction } from '../types';

interface RegulatorySectionProps {
  actions: RegulatoryAction[];
}

export const RegulatorySection: React.FC<RegulatorySectionProps> = ({ actions }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Gavel className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Regulatory Enforcement & Disciplinary History
          </h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          actions.length > 0
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        }`}>
          {actions.length > 0 ? `${actions.length} Enforcement Records` : 'Clean Regulatory History'}
        </span>
      </div>

      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((act, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                    {act.authority}
                  </span>
                  {act.date && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {act.date}
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {act.status}
                </span>
              </div>

              <div className="text-sm font-semibold text-white">
                Violation: <span className="font-normal text-slate-300">{act.violation}</span>
              </div>

              {act.penalty && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-rose-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Sanction / Disgorgement: <strong className="text-white">{act.penalty}</strong></span>
                </div>
              )}

              {act.sourceUrl && (
                <div className="pt-1">
                  <a
                    href={act.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <span>View Official Regulatory Docket</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-bold text-slate-200">No Disciplinary Penalties or Injunctions Found</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Checked against major capital market watchdogs (SEC, CFTC, FCA, FINRA, BaFin, MAS). Zero active fines, censures, or director disqualifications.
          </p>
        </div>
      )}
    </div>
  );
};
