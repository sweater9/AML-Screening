import React, { useState } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  AlertOctagon, 
  CheckCircle2, 
  Filter, 
  Search, 
  Calendar, 
  Globe, 
  ShieldAlert,
  Flame
} from 'lucide-react';
import { AdverseMediaItem } from '../types';
import { getSentimentDetails, formatDate } from '../utils/complianceUtils';

interface AdverseMediaSectionProps {
  items: AdverseMediaItem[];
  groundingSources?: { title: string; url: string }[];
}

export const AdverseMediaSection: React.FC<AdverseMediaSectionProps> = ({ items, groundingSources = [] }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract all unique categories
  const allCategories = Array.from(
    new Set(items.flatMap((item) => item.categories || []))
  );

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      categoryFilter === 'ALL' || (item.categories && item.categories.includes(categoryFilter));
    const matchesSeverity =
      severityFilter === 'ALL' || item.severity === severityFilter;
    const matchesSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const criticalCount = items.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = items.filter((i) => i.severity === 'HIGH').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Newspaper className="w-4 h-4" />
            <span>Adverse Media & Negative News Intelligence</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Scored Media Articles & Public Record Scrutiny
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-extracted news mentions with sentiment polarity, criminal typology categorization, and direct citations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Total Articles: <span className="font-bold text-white">{items.length}</span>
          </div>
          {criticalCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-700/50 text-red-300 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>{criticalCount} Critical</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        {/* Search within news */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search headline or snippet..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          {allCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Crime Categories</option>
              {allCategories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Media Cards List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-200">No Matching Adverse Media Items Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No adverse articles matched the active filter criteria. Either the target has a clean public press profile, or no matches met the threshold.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const sentiment = getSentimentDetails(item.sentimentScore, item.sentimentLabel);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.severity === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-800/40 hover:border-red-600/60'
                    : item.severity === 'HIGH'
                    ? 'bg-orange-950/20 border-orange-800/40 hover:border-orange-600/60'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {item.source}
                      </span>
                      {item.date && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.date)}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Credibility: {item.credibility}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <span>{item.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-white shrink-0" />
                      </a>
                    </h4>
                  </div>

                  {/* Sentiment & Severity Pills */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${sentiment.bgClass} ${sentiment.colorClass}`}
                    >
                      Score: {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore} ({sentiment.text})
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-900/60 text-red-200 border-red-700'
                          : item.severity === 'HIGH'
                          ? 'bg-orange-900/60 text-orange-200 border-orange-700'
                          : item.severity === 'MEDIUM'
                          ? 'bg-amber-900/60 text-amber-200 border-amber-700'
                          : 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                </div>

                {/* Excerpt Snippet */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed italic my-2">
                  "{item.snippet}"
                </div>

                {/* Categories & Relevance */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {item.categories &&
                      item.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {cat}
                        </span>
                      ))}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>Relevance Match:</span>
                    <span className="font-mono font-bold text-slate-200">{item.relevanceScore}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grounding Sources Reference List */}
      {groundingSources && groundingSources.length > 0 && (
        <div className="pt-4 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Google Search Grounding Verifications & Audit Links:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {groundingSources.slice(0, 6).map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center justify-between truncate"
              >
                <span className="truncate pr-2">{src.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
