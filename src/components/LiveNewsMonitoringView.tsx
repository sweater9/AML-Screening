import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  Zap, 
  Search, 
  Pause, 
  Play, 
  ChevronRight, 
  FileText, 
  Building2, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ShieldCheck,
  Check,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { MonitoredSubject, MonitoringAlert, VerificationReport } from '../types';

interface LiveNewsMonitoringViewProps {
  subjects: MonitoredSubject[];
  alerts: MonitoringAlert[];
  isLoading: boolean;
  onRefreshScan: (subjectId?: string) => Promise<void>;
  onToggleMonitoring: (subjectId: string) => Promise<void>;
  onAcknowledgeAlert: (alertId: string, officerName: string, actionNote: string) => Promise<void>;
  onSimulateEvent: (subjectId?: string, headline?: string, severity?: string) => Promise<void>;
  onViewReportDossier?: (reportId: string) => void;
}

export const LiveNewsMonitoringView: React.FC<LiveNewsMonitoringViewProps> = ({
  subjects,
  alerts,
  isLoading,
  onRefreshScan,
  onToggleMonitoring,
  onAcknowledgeAlert,
  onSimulateEvent,
  onViewReportDossier,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [ackModalAlert, setAckModalAlert] = useState<MonitoringAlert | null>(null);
  const [officerName, setOfficerName] = useState<string>('Compliance Officer (MLRO)');
  const [officerNote, setOfficerNote] = useState<string>('');
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [secondsUntilNextScan, setSecondsUntilNextScan] = useState<number>(30);

  // Auto-scan countdown timer
  useEffect(() => {
    if (!autoScanEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilNextScan((prev) => {
        if (prev <= 1) {
          // Trigger scan silently
          onRefreshScan();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoScanEnabled, onRefreshScan]);

  const handleManualScan = async () => {
    setIsScanning(true);
    await onRefreshScan(selectedSubjectId === 'ALL' ? undefined : selectedSubjectId);
    setIsScanning(false);
    setSecondsUntilNextScan(30);
  };

  const handleSimulate = async (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM') => {
    setSimulating(true);
    const targetSub = selectedSubjectId !== 'ALL' ? selectedSubjectId : (subjects[0]?.id || undefined);
    await onSimulateEvent(targetSub, undefined, severity);
    setSimulating(false);
  };

  const handleOpenAckModal = (alert: MonitoringAlert) => {
    setAckModalAlert(alert);
    setOfficerNote(`Reviewed against current onboarding policy. Risk increase of +${alert.deltaRiskScore} logged to audit file.`);
  };

  const handleConfirmAcknowledge = async () => {
    if (!ackModalAlert) return;
    await onAcknowledgeAlert(ackModalAlert.id, officerName, officerNote);
    setAckModalAlert(null);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alt) => {
    const matchSubject = selectedSubjectId === 'ALL' || alt.subjectId === selectedSubjectId;
    const matchSev = filterSeverity === 'ALL' || alt.severity === filterSeverity;
    return matchSubject && matchSev;
  });

  const unackCount = alerts.filter(a => !a.acknowledged).length;

  const getSeverityBadge = (severity: MonitoringAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Radar Control Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoScanEnabled ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${autoScanEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Real-Time Adverse Media & Stream Radar
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  LIVE FEED
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Continuous 24/7 background telemetry across global news wires (Reuters, Bloomberg), SEC/DOJ enforcement gazettes, OFAC/UN sanctions lists, and international investigative journalism syndicates.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Countdown / Auto-scan switch */}
            <button
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
              title="Toggle continuous automated radar polling"
            >
              {autoScanEnabled ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{autoScanEnabled ? `Auto-Scan: ${secondsUntilNextScan}s` : 'Auto-Scan: Paused'}</span>
            </button>

            {/* Manual Scan Button */}
            <button
              onClick={handleManualScan}
              disabled={isScanning || isLoading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Data Streams...' : 'Scan Streams Now'}</span>
            </button>

            {/* Simulation Trigger Dropdown/Buttons */}
            <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Test Ingestion:
              </span>
              <button
                onClick={() => handleSimulate('CRITICAL')}
                disabled={simulating}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                title="Simulate incoming Breaking Critical Sanction / Enforcement Alert"
              >
                Critical
              </button>
              <button
                onClick={() => handleSimulate('HIGH')}
                disabled={simulating}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 transition"
                title="Simulate incoming High Adverse Media Headline"
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Global Stream Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Monitored Entities</span>
              <p className="text-lg font-bold text-white font-mono">{subjects.length}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Alerts</span>
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-white font-mono">{alerts.length}</p>
                {unackCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/50">
                    {unackCount} Unacknowledged
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Streams Connected</span>
              <p className="text-lg font-bold text-white font-mono">14 Global Wires</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Telemetry Cadence</span>
              <p className="text-lg font-bold text-white font-mono">Every 30s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monitored Subjects Dossiers (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monitored Entities & Individuals
              </h3>
            </div>
            <button
              onClick={() => setSelectedSubjectId('ALL')}
              className={`text-xs font-semibold px-2 py-0.5 rounded-md transition ${
                selectedSubjectId === 'ALL'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Show All ({subjects.length})
            </button>
          </div>

          {/* Subjects List Cards */}
          <div className="space-y-3">
            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              const hasAlerts = sub.alertCount > 0;
              const deltaRisk = sub.currentRiskScore - sub.initialRiskScore;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/70 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {sub.subjectType === 'entity' ? (
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-white hover:text-indigo-300 transition">
                          {sub.subjectName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {sub.jurisdiction} • {sub.linkedRegistryId}
                      </p>
                    </div>

                    {/* Risk Score Pill */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center space-x-1">
                        <span className={`text-base font-bold font-mono ${
                          sub.currentRiskScore > 75 ? 'text-rose-400' :
                          sub.currentRiskScore > 40 ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {sub.currentRiskScore}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </div>
                      {deltaRisk > 0 && (
                        <div className="flex items-center justify-end text-[10px] font-bold text-rose-400">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> +{deltaRisk} pts
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telemetry info row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        sub.monitoringStatus === 'ALERT_TRIGGERED' ? 'bg-rose-500 animate-pulse' :
                        sub.monitoringStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-600'
                      }`} />
                      <span className="capitalize">{sub.monitoringStatus.replace('_', ' ').toLowerCase()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">
                        Scanned {Math.max(1, Math.floor((Date.now() - new Date(sub.lastScannedAt).getTime()) / 1000))}s ago
                      </span>
                      {hasAlerts && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">
                          {sub.alertCount} {sub.alertCount === 1 ? 'Alert' : 'Alerts'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Headline Ingested */}
                  {sub.recentHeadlinesScanned && sub.recentHeadlinesScanned.length > 0 && (
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px]">
                      <span className="text-[10px] text-slate-500 font-medium block">Latest Scanned Headline:</span>
                      <p className="text-slate-300 line-clamp-1 italic mt-0.5">
                        "{sub.recentHeadlinesScanned[0].title}"
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                        <span>{sub.recentHeadlinesScanned[0].source}</span>
                        <span className={sub.recentHeadlinesScanned[0].sentimentScore < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          Sentiment: {sub.recentHeadlinesScanned[0].sentimentScore > 0 ? `+${sub.recentHeadlinesScanned[0].sentimentScore}` : sub.recentHeadlinesScanned[0].sentimentScore}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Card Actions */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/40 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMonitoring(sub.id);
                      }}
                      className="text-slate-400 hover:text-white transition font-medium text-[11px]"
                    >
                      {sub.monitoringStatus === 'PAUSED' ? 'Resume Stream' : 'Pause Stream'}
                    </button>

                    {onViewReportDossier && sub.reportId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewReportDossier(sub.reportId);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition font-medium text-[11px] flex items-center gap-1"
                      >
                        <span>View Initial Dossier</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Risk Alerts Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Newly Identified Risk Alerts Stream ({filteredAlerts.length})
              </h3>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center space-x-1 text-xs">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded-md font-medium transition text-[11px] ${
                    filterSeverity === sev
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Feed */}
          {filteredAlerts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">No Triggered Risk Alerts in Active Scope</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All connected data streams are quiet. You can use the "Test Ingestion" buttons in the top bar to simulate real-time news alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-5 rounded-xl border transition space-y-3 ${
                    alt.acknowledged
                      ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                      : 'bg-slate-900 border-rose-500/40 shadow-lg shadow-rose-500/5'
                  }`}
                >
                  {/* Alert Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getSeverityBadge(alt.severity)}`}>
                          {alt.severity} ALERT
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {alt.alertType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold text-indigo-300">
                          {alt.subjectName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug pt-1">
                        {alt.headline}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-slate-500 block">
                        {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        +{alt.deltaRiskScore} Risk Delta
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    {alt.summary}
                  </p>

                  {/* Detected Keywords Chips */}
                  {alt.detectedKeywords && alt.detectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Keywords:
                      </span>
                      {alt.detectedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-semibold text-rose-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Source & Actions Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-800/80 gap-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-xs">{alt.source}</span>
                      {alt.sourceUrl && (
                        <a
                          href={alt.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 font-medium"
                        >
                          View Wire <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Acknowledgment status / button */}
                    <div>
                      {alt.acknowledged ? (
                        <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acknowledged by {alt.acknowledgedBy}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAckModal(alt)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm"
                        >
                          Acknowledge & Escalate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acknowledge Alert Modal */}
      {ackModalAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Compliance Alert Sign-off</h3>
                <p className="text-xs text-slate-400">
                  Log official AML review of breaking adverse event into immutable audit trail
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Headline</span>
              <p className="text-slate-200 font-semibold">{ackModalAlert.headline}</p>
              <p className="text-slate-400 text-[11px]">{ackModalAlert.subjectName} • {ackModalAlert.severity} Severity</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reviewing Officer Name / Title
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Action Taken / Audit Note
                </label>
                <textarea
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Enter specific risk mitigation or compliance action..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAckModalAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcknowledge}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Sign-off</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
