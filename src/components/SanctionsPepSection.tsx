import React from 'react';
import { ShieldAlert, CheckCircle2, UserCheck, Crown, Scale } from 'lucide-react';
import { SanctionsHit, PEPHit } from '../types';

interface SanctionsPepSectionProps {
  sanctionsHits?: SanctionsHit[];
  pepHit?: PEPHit | null;
}

export const SanctionsPepSection: React.FC<SanctionsPepSectionProps> = ({ sanctionsHits = [], pepHit }) => {
  const pep = pepHit ?? ({ isPEP: null, riskJustification: 'PEP status was not verified by the available evidence.' } as unknown as PEPHit);
  const isPep = pep.isPEP === true;
  const isPepVerifiedNegative = pep.isPEP === false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2"><ShieldAlert className="w-4 h-4 text-red-400" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Sanctions & Global Watchlists Cross-Reference</h3></div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${sanctionsHits.length ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
            {sanctionsHits.length ? `${sanctionsHits.length} Candidate Match${sanctionsHits.length === 1 ? '' : 'es'}` : 'No candidate matches returned'}
          </span>
        </div>
        {sanctionsHits.length ? <div className="space-y-3">{sanctionsHits.map((hit, idx) => <div key={idx} className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-2.5"><div className="text-[10px] font-bold uppercase text-red-400">{hit.listName}</div><div className="text-sm font-bold text-white">Matched Entity: <span className="font-mono text-red-200">{hit.matchedName}</span></div><div className="text-xs text-slate-300">{hit.reason}</div><div className="text-[11px] text-slate-400">{hit.matchType} • {hit.matchConfidence}% confidence • {hit.status}</div></div>)}</div> : <div className="p-6 text-center bg-slate-950/50 rounded-xl border border-slate-800 space-y-3"><CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" /><div className="text-sm font-bold text-white">No candidate sanctions matches returned</div><p className="text-xs text-slate-400 max-w-md mx-auto">This is not a universal sanctions-clearance conclusion. Review source coverage and verification gaps in the report before making a compliance decision.</p></div>}
      </div>

      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800"><div className="flex items-center space-x-2"><Crown className="w-4 h-4 text-amber-400" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">PEP Exposure Assessment</h3></div><span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${isPep ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : isPepVerifiedNegative ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>{isPep ? 'PEP Flagged' : isPepVerifiedNegative ? 'No PEP hit' : 'Not verified'}</span></div>
          <div className="mt-4">
            {isPep ? <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-3"><div className="text-sm font-bold text-white">{pep.role || 'Public function identified'}</div><div className="text-xs text-slate-400">Jurisdiction: {pep.country || 'Not supplied'}</div><div className="text-xs text-slate-300">{pep.riskJustification}</div></div> : <div className="p-5 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2"><UserCheck className={`w-8 h-8 mx-auto ${isPepVerifiedNegative ? 'text-emerald-400' : 'text-slate-400'}`} /><div className="text-sm font-bold text-slate-200">{isPepVerifiedNegative ? 'No PEP hit returned' : 'PEP status requires verification'}</div><p className="text-xs text-slate-400 leading-relaxed">{pep.riskJustification || 'The API response did not contain sufficient PEP evidence to make a determination.'}</p></div>}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2"><Scale className="w-4 h-4 text-slate-500 shrink-0" /><span>Only evidence returned by the screening service is represented here; missing evidence remains unverified.</span></div>
      </div>
    </div>
  );
};
