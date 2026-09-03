import React from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  PieChart as PieIcon, 
  BarChart2, 
  Globe, 
  ShieldAlert,
  Flame,
  Scale,
  Sparkles
} from 'lucide-react';
import { VerificationReport } from '../types';
import { getSentimentDetails, formatDate } from '../utils/complianceUtils';

interface SentimentDeepDiveViewProps {
  report: VerificationReport;
}

export const SentimentDeepDiveView: React.FC<SentimentDeepDiveViewProps> = ({ report }) => {
  const { riskAnalysis, adverseMediaItems } = report;
  const { sentimentBreakdown } = riskAnalysis;
  const overallDetails = getSentimentDetails(sentimentBreakdown.overallSentiment);

  // Group media by category
  const categoryMap: Record<string, { count: number; totalScore: number }> = {};
  adverseMediaItems.forEach((item) => {
    (item.categories || ['Uncategorized']).forEach((cat) => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, totalScore: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].totalScore += item.sentimentScore;
    });
  });

  const categoryAverages = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    avgScore: Math.round(data.totalScore / data.count),
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <TrendingDown className="w-4 h-4" />
              <span>Adverse NLP Sentiment & Linguistic Tone Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sentiment Profiling for {report.subject.name}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Deconstructed linguistic polarity, news severity indicators, credibility distribution, and semantic narrative extraction across public media.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Net Polarity</div>
              <div className={`text-2xl font-black font-mono mt-0.5 ${
                sentimentBreakdown.overallSentiment < 0 ? 'text-red-400' :
                sentimentBreakdown.overallSentiment > 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {sentimentBreakdown.overallSentiment > 0 ? `+${sentimentBreakdown.overallSentiment}` : sentimentBreakdown.overallSentiment}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Tone Class</div>
              <div className={`text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded border ${overallDetails.bgClass} ${overallDetails.colorClass}`}>
                {overallDetails.text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Narrative Analysis & Category Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Narrative & Semantic Themes (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Semantic Narrative Analysis & Semantic Clusters
            </h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Our neural sentiment pipeline analyzed the linguistic polarity of public news reports, judicial transcripts, and investigative releases. Negative sentiment is heavily concentrated around financial crime allegations, law enforcement motions, and regulatory censures.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Dominant Narrative Lexical Clusters:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {sentimentBreakdown.dominantThemes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5"
                  >
                    <span>#{theme}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Polarity Distribution Breakdown */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-semibold text-slate-300">Polarity Proportions:</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40 text-center">
                  <div className="text-[10px] font-bold uppercase text-red-400">Adverse Tone</div>
                  <div className="text-xl font-bold text-red-300 font-mono mt-0.5">
                    {sentimentBreakdown.negativePercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Hostile / Accusatory</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Neutral Tone</div>
                  <div className="text-xl font-bold text-slate-300 font-mono mt-0.5">
                    {sentimentBreakdown.neutralPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Factual / Corporate</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">Favorable Tone</div>
                  <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
                    {sentimentBreakdown.positivePercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Commendatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment by Crime Category (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Sentiment By Crime Category
            </h3>
          </div>

          <div className="space-y-3">
            {categoryAverages.length > 0 ? (
              categoryAverages.map((cat, idx) => {
                const sentiment = getSentimentDetails(cat.avgScore);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{cat.category}</span>
                      <span className={`font-mono font-bold ${sentiment.colorClass}`}>
                        Avg: {cat.avgScore > 0 ? `+${cat.avgScore}` : cat.avgScore}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full ${
                          cat.avgScore <= -50 ? 'bg-red-500' :
                          cat.avgScore < 0 ? 'bg-orange-500' :
                          cat.avgScore === 0 ? 'bg-slate-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.abs(cat.avgScore)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{cat.count} {cat.count === 1 ? 'article analyzed' : 'articles analyzed'}</span>
                      <span className="capitalize">{sentiment.text}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No categorized adverse media detected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Articles Scored Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
          Individual Media Mentions & Sentiment Matrix
        </h3>

        <div className="space-y-3">
          {adverseMediaItems.map((item) => {
            const sentiment = getSentimentDetails(item.sentimentScore, item.sentimentLabel);
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-indigo-400">{item.source}</span>
                    {item.date && <span className="text-slate-500">• {formatDate(item.date)}</span>}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.severity} Severity
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 italic leading-snug">
                    "{item.snippet}"
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-base font-black font-mono ${sentiment.colorClass}`}>
                    {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-block mt-0.5 ${sentiment.bgClass} ${sentiment.colorClass}`}>
                    {sentiment.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
