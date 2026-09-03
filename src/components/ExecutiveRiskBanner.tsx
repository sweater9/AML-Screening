import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  Scale, 
  CheckCircle2, 
  Building2, 
  User, 
  Globe, 
  Clock, 
  Lock, 
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { VerificationReport } from '../types';
import { getRecommendationBadge, getRiskColor, formatDateTime } from '../utils/complianceUtils';

interface ExecutiveRiskBannerProps {
  report: VerificationReport;
  onOpenSignOff: () => void;
}

export const ExecutiveRiskBanner: React.FC<ExecutiveRiskBannerProps> = ({ report, onOpenSignOff }) => {
  const riskInfo = getRiskColor(report.riskAnalysis.riskLevel);
  const recBadge = getRecommendationBadge(report.complianceRecommendation);
  const score = report.riskAnalysis.compositeScore;

  const sanctionsCount = report.sanctionsHits.length;
  const adverseCount = report.adverseMediaItems.length;
  const regCount = report.regulatoryActions.length;
  const isPEP = report.pepHit.isPEP;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow based on risk */}
      <div 
        className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
          report.riskAnalysis.riskLevel === 'CRITICAL' ? 'bg-red-500' :
          report.riskAnalysis.riskLevel === 'HIGH' ? 'bg-orange-500' :
          report.riskAnalysis.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} 
      />

      <div className="relative z-10 space-y-6">
        {/* Top Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              {report.subject.subjectType === 'individual' ? <User className="w-5 h-5 text-sky-400" /> : <Building2 className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">{report.subject.name}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {report.subject.subjectType === 'individual' ? 'Natural Person' : 'Corporate Entity'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {report.subject.jurisdiction}
                </span>
                {report.linkedEntityProfile && (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verified ID: {report.linkedEntityProfile.externalId.split('|')[0].trim()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>Dossier: <span className="font-mono text-slate-300">{report.reportId}</span></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(report.generatedAt)}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                  {report.verificationHash}
                </span>
              </div>
            </div>
          </div>

          {/* Officer Status / Sign-Off Action */}
          <div className="flex items-center gap-2">
            {report.officerSignature ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs flex items-center gap-1.5 font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Signed off by: {report.officerSignature}</span>
              </div>
            ) : (
              <button
                onClick={onOpenSignOff}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Compliance Sign-Off & Disposition</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Risk Matrix Gauge & Decision Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Composite Score Circle & Tier */}
          <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center relative">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Composite AML / ML-TF Risk Index
            </span>

            <div className="relative w-36 h-36 flex items-center justify-center my-1">
              {/* Circular SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-slate-800"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-1000 ease-out ${
                    score >= 85 ? 'text-red-500' :
                    score >= 60 ? 'text-orange-500' :
                    score >= 25 ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * score) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-mono">{score}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">out of 100</span>
              </div>
            </div>

            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${riskInfo.badgeBg} ${riskInfo.badgeText} ${riskInfo.borderColor}`}>
              {report.riskAnalysis.riskLevel} RISK TIER
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Calculated across sanctions, negative news sentiment, PEP proximity, and ML typologies.
            </p>
          </div>

          {/* Recommendation & Statutory Directive */}
          <div className="lg:col-span-8 space-y-4">
            <div className={`p-4 rounded-xl border ${recBadge.bgColor} ${recBadge.borderColor} space-y-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className={`w-5 h-5 ${recBadge.textColor}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Compliance Disposition:</span>
                </div>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${recBadge.bgColor} ${recBadge.textColor} ${recBadge.borderColor}`}>
                  {recBadge.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">
                {recBadge.actionText}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {report.recommendationRationale}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Sanctions Hits</div>
                <div className={`text-base font-bold mt-0.5 ${sanctionsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {sanctionsCount > 0 ? `${sanctionsCount} Active Hit` : '0 Hits (Clear)'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Adverse Articles</div>
                <div className={`text-base font-bold mt-0.5 ${adverseCount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {adverseCount} {adverseCount === 1 ? 'Article' : 'Articles'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">PEP Exposure</div>
                <div className={`text-base font-bold mt-0.5 ${isPEP ? 'text-amber-400' : 'text-slate-300'}`}>
                  {isPEP ? report.pepHit.pepTier.split('(')[0] : 'Non-PEP'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Regulatory Actions</div>
                <div className={`text-base font-bold mt-0.5 ${regCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {regCount} {regCount === 1 ? 'Action' : 'Actions'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quota / Rate Limit Awareness Notice */}
        {report.quotaNotice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-300">Rate Limit Awareness: </span>
              <span className="text-amber-200/90">{report.quotaNotice}</span>
            </div>
          </div>
        )}

        {/* Executive Summary Briefing */}
        <div className="pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Executive Forensic Briefing:</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {report.executiveSummary}
          </p>

          {/* Key Findings Bullet Tags */}
          {report.keyFindings && report.keyFindings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {report.keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
