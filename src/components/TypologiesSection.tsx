import React from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Activity, 
  ArrowUpRight 
} from 'lucide-react';
import { MLTFTypology } from '../types';

interface TypologiesSectionProps {
  typologies: MLTFTypology[];
}

export const TypologiesSection: React.FC<TypologiesSectionProps> = ({ typologies }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Detected ML/TF Red Flags & Typologies
          </h3>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          typologies.length > 0
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        }`}>
          {typologies.length > 0 ? `${typologies.length} Red Flags Flagged` : '0 Typology Flags'}
        </span>
      </div>

      {typologies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typologies.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <AlertOctagon className={`w-4 h-4 shrink-0 ${
                    t.riskWeight === 'HIGH' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <span>{t.name}</span>
                </h4>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  t.riskWeight === 'HIGH'
                    ? 'bg-red-950/60 text-red-300 border-red-800/60'
                    : t.riskWeight === 'MEDIUM'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {t.riskWeight} WEIGHT
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {t.description}
              </p>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Observed Trigger: </span>
                <span className="text-slate-200 font-mono text-[11px]">{t.indicator}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <div className="text-sm font-bold text-slate-200">No ML/TF Criminal Typologies Detected</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Analysis of known entity structure, jurisdictional channels, and media footprint revealed no indicators of structuring, trade-based money laundering, or smurfing.
          </p>
        </div>
      )}
    </div>
  );
};
