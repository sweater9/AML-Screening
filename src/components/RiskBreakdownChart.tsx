import React from 'react';
import { 
  BarChart2, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Layers, 
  Info, 
  ShieldAlert,
  Tag
} from 'lucide-react';
import { MLTFRiskAnalysis } from '../types';
import { getSentimentDetails } from '../utils/complianceUtils';

interface RiskBreakdownChartProps {
  riskAnalysis: MLTFRiskAnalysis;
}

export const RiskBreakdownChart: React.FC<RiskBreakdownChartProps> = ({ riskAnalysis }) => {
  const { subScores, sentimentBreakdown } = riskAnalysis;
  const sentiment = getSentimentDetails(sentimentBreakdown.overallSentiment);

  const subScoreItems = [
    { label: 'Adverse Media Severity', score: subScores.adverseMedia, desc: 'Negative news recency and crime allegations' },
    { label: 'Sanctions & Watchlists', score: subScores.sanctionsWatchlist, desc: 'OFAC SDN, UN, EU, UK OFSI list match' },
    { label: 'Financial Crime & Fraud', score: subScores.financialCrimeFraud, desc: 'Securities fraud, wire fraud, tax evasion' },
    { label: 'PEP & State Influence', score: subScores.pepExposure, desc: 'Political exposure and public procurement power' },
    { label: 'Jurisdiction FATF Risk', score: subScores.jurisdictionRisk, desc: 'FATF greylist, secrecy haven, cross-border flows' },
    { label: 'Opacity & Layering Risk', score: subScores.opacityStructure, desc: 'Offshore shell entities, nominee shareholders' },
  ];

  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-red-500';
    if (val >= 50) return 'bg-orange-500';
    if (val >= 25) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Sub-Scores Matrix (7 Cols) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Multidimensional Risk Factor Breakdown
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Score scale: 0 to 100</span>
        </div>

        <div className="space-y-3.5">
          {subScoreItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                  <span>{item.label}</span>
                </div>
                <span className={`font-mono font-bold ${
                  item.score >= 75 ? 'text-red-400' :
                  item.score >= 50 ? 'text-orange-400' :
                  item.score >= 25 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {item.score}/100
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-700 ease-out rounded-full ${getBarColor(item.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: AI Sentiment Analysis Panel (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                AI Sentiment & Media Tone Matrix
              </h3>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${sentiment.bgClass} ${sentiment.colorClass}`}>
              {sentiment.text}
            </span>
          </div>

          {/* Polarity Gauge */}
          <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Overall Sentiment Polarity Index</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {sentimentBreakdown.overallSentiment < 0 ? (
                <TrendingDown className="w-6 h-6 text-red-400" />
              ) : sentimentBreakdown.overallSentiment > 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <Minus className="w-6 h-6 text-slate-400" />
              )}
              <span className={`text-3xl font-black font-mono ${
                sentimentBreakdown.overallSentiment <= -30 ? 'text-red-400' :
                sentimentBreakdown.overallSentiment < 0 ? 'text-amber-400' :
                sentimentBreakdown.overallSentiment === 0 ? 'text-slate-300' : 'text-emerald-400'
              }`}>
                {sentimentBreakdown.overallSentiment > 0 ? `+${sentimentBreakdown.overallSentiment}` : sentimentBreakdown.overallSentiment}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>

            {/* Spectrum Indicator */}
            <div className="mt-3 relative">
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-600 via-amber-500 via-slate-500 to-emerald-500 opacity-80" />
              <div 
                className="absolute top-0 w-3 h-4 -mt-1 bg-white border border-black rounded shadow-md transform -translate-x-1/2"
                style={{ 
                  left: `${((sentimentBreakdown.overallSentiment + 100) / 200) * 100}%` 
                }}
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                <span>-100 (Hostile/Adverse)</span>
                <span>0 (Neutral)</span>
                <span>+100 (Favorable)</span>
              </div>
            </div>
          </div>

          {/* Sentiment Proportions */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Tone Distribution:</div>
            <div className="flex h-3 rounded-lg overflow-hidden gap-0.5">
              <div 
                style={{ width: `${sentimentBreakdown.negativePercent}%` }} 
                className="bg-red-500" 
                title={`Negative: ${sentimentBreakdown.negativePercent}%`}
              />
              <div 
                style={{ width: `${sentimentBreakdown.neutralPercent}%` }} 
                className="bg-slate-600" 
                title={`Neutral: ${sentimentBreakdown.neutralPercent}%`}
              />
              <div 
                style={{ width: `${sentimentBreakdown.positivePercent}%` }} 
                className="bg-emerald-500" 
                title={`Positive: ${sentimentBreakdown.positivePercent}%`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Negative: <b className="text-slate-200">{sentimentBreakdown.negativePercent}%</b></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Neutral: <b className="text-slate-200">{sentimentBreakdown.neutralPercent}%</b></span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Positive: <b className="text-slate-200">{sentimentBreakdown.positivePercent}%</b></span>
              </span>
            </div>
          </div>
        </div>

        {/* Dominant Adverse / Narrative Themes */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dominant Narrative Themes Detected:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sentimentBreakdown.dominantThemes && sentimentBreakdown.dominantThemes.length > 0 ? (
              sentimentBreakdown.dominantThemes.map((theme, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 rounded-md text-xs bg-slate-950 text-slate-300 border border-slate-700/80 font-medium"
                >
                  #{theme}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No adverse themes detected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
