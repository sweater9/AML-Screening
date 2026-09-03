import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Award,
  Crown,
  Scale
} from 'lucide-react';
import { SanctionsHit, PEPHit } from '../types';

interface SanctionsPepSectionProps {
  sanctionsHits: SanctionsHit[];
  pepHit: PEPHit;
}

export const SanctionsPepSection: React.FC<SanctionsPepSectionProps> = ({ sanctionsHits, pepHit }) => {
  const verifiedLists = [
    'US OFAC Specially Designated Nationals (SDN)',
    'United Nations Security Council Sanctions',
    'European Union Consolidated Financial Sanctions',
    'UK HM Treasury / OFSI Financial Sanctions',
    'Interpol Red Notices & Most Wanted',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Sanctions & Global Watchlists (7 Cols) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sanctions & Global Watchlists Cross-Reference
            </h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            sanctionsHits.length > 0
              ? 'bg-red-500/20 text-red-400 border-red-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          }`}>
            {sanctionsHits.length > 0 ? `${sanctionsHits.length} Match Detected` : '0 Hits (Clear)'}
          </span>
        </div>

        {sanctionsHits.length > 0 ? (
          <div className="space-y-3">
            {sanctionsHits.map((hit, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-900/40 px-2 py-0.5 rounded border border-red-700/60">
                      {hit.listName}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">
                      Matched Entity: <span className="font-mono text-red-200">{hit.matchedName}</span>
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-red-400">
                      {hit.matchConfidence}% Confidence
                    </span>
                    <div className="text-[10px] text-slate-400 font-semibold">{hit.matchType} MATCH</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-semibold mb-0.5">Designation Reason:</div>
                  <p>{hit.reason}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Sanctions Program: <strong className="text-slate-200">{hit.program || 'N/A'}</strong></span>
                  <span className="font-semibold text-red-400 uppercase">{hit.status} DESIGNATION</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div>
              <div className="text-sm font-bold text-white">Negative Confirmation: Zero Active Sanctions Matches</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                The subject does not appear on any checked international embargo, counter-proliferation, or asset freeze registers.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Registers Checked:
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {verifiedLists.map((list, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    ✓ {list}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: PEP (Politically Exposed Person) Screening (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PEP Exposure Assessment
              </h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              pepHit.isPEP
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {pepHit.isPEP ? 'PEP Flagged' : 'Non-PEP'}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {pepHit.isPEP ? (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                    {pepHit.pepTier}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{pepHit.role || 'High-Ranking Public Office'}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Jurisdiction: <strong className="text-slate-200">{pepHit.country || 'International'}</strong> • Period: <strong className="text-slate-200">{pepHit.period || 'Recent'}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-amber-300">Bribery & Influence Risk Justification:</div>
                  <p className="leading-relaxed">{pepHit.riskJustification}</p>
                </div>

                <div className="text-[11px] text-amber-200 bg-amber-900/30 p-2 rounded border border-amber-800/40">
                  ⚠️ <strong>FATF Recommendation 12 Compliance:</strong> Financial institutions must apply Enhanced Due Diligence (EDD), obtain senior management sign-off, and verify source of wealth.
                </div>
              </div>
            ) : (
              <div className="p-5 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <UserCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-slate-200">No Direct Political Exposure Detected</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The subject does not hold senior government, military, judicial, or state-owned enterprise (SOE) roles, nor immediate family ties to Tier 1/2 officials.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Regulatory Advisory Note */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Screened against national gazettes, election registers, and PEP databases.</span>
        </div>
      </div>
    </div>
  );
};
