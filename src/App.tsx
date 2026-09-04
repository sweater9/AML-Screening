import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { ScreeningRequest, VerificationReport, MonitoredSubject, MonitoringAlert } from './types';
import { Header } from './components/Header';
import { ScreeningForm } from './components/ScreeningForm';
import { apiFetch, HAS_REMOTE_API } from './utils/api';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const ExecutiveRiskBanner = lazy(() => import('./components/ExecutiveRiskBanner').then(m => ({ default: m.ExecutiveRiskBanner })));
const EntityLinkingSection = lazy(() => import('./components/EntityLinkingSection').then(m => ({ default: m.EntityLinkingSection })));
const LiveNewsMonitoringView = lazy(() => import('./components/LiveNewsMonitoringView').then(m => ({ default: m.LiveNewsMonitoringView })));
const RiskBreakdownChart = lazy(() => import('./components/RiskBreakdownChart').then(m => ({ default: m.RiskBreakdownChart })));
const AdverseMediaSection = lazy(() => import('./components/AdverseMediaSection').then(m => ({ default: m.AdverseMediaSection })));
const SanctionsPepSection = lazy(() => import('./components/SanctionsPepSection').then(m => ({ default: m.SanctionsPepSection })));
const TypologiesSection = lazy(() => import('./components/TypologiesSection').then(m => ({ default: m.TypologiesSection })));
const RegulatorySection = lazy(() => import('./components/RegulatorySection').then(m => ({ default: m.RegulatorySection })));
const MitigationAndAuditSection = lazy(() => import('./components/MitigationAndAuditSection').then(m => ({ default: m.MitigationAndAuditSection })));
const HistoricalReportsList = lazy(() => import('./components/HistoricalReportsList').then(m => ({ default: m.HistoricalReportsList })));
const OfficialPrintDossier = lazy(() => import('./components/OfficialPrintDossier').then(m => ({ default: m.OfficialPrintDossier })));
const SentimentDeepDiveView = lazy(() => import('./components/SentimentDeepDiveView').then(m => ({ default: m.SentimentDeepDiveView })));

const STORAGE_KEY = 'veritas_screen_reports_v1';
const ViewFallback = () => <div className="py-12 text-center text-xs text-slate-500">Loading view…</div>;

export default function App() {
  const [activeTab, setActiveTab] = useState<'screening' | 'report' | 'sentiment' | 'vault' | 'monitoring'>('screening');
  const [currentReport, setCurrentReport] = useState<VerificationReport | null>(null);
  const [savedReports, setSavedReports] = useState<VerificationReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignOffOpen, setIsSignOffOpen] = useState(false);
  const [monitoredSubjects, setMonitoredSubjects] = useState<MonitoredSubject[]>([]);
  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringAlert[]>([]);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: VerificationReport[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedReports(parsed);
          setCurrentReport(parsed[0]);
        }
      }
    } catch (e) { console.warn('Failed to parse saved reports from localStorage:', e); }
  }, []);

  const fetchMonitoringData = useCallback(async () => {
    if (!HAS_REMOTE_API) return;
    try {
      const [subsRes, alertsRes] = await Promise.all([apiFetch('/api/monitoring/subjects'), apiFetch('/api/monitoring/alerts')]);
      if (subsRes.ok && alertsRes.ok) {
        const subsData = await subsRes.json();
        const alertsData = await alertsRes.json();
        if (subsData.subjects) setMonitoredSubjects(subsData.subjects);
        if (alertsData.alerts) setMonitoringAlerts(alertsData.alerts);
      }
    } catch (e) { console.warn('Failed to fetch monitoring telemetry data:', e); }
  }, []);

  useEffect(() => { fetchMonitoringData(); }, [fetchMonitoringData]);

  const persistReports = (reports: VerificationReport[]) => {
    setSavedReports(reports);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }
    catch (e) { console.warn('Failed to persist reports to localStorage:', e); }
  };

  const requireApi = () => {
    if (HAS_REMOTE_API) return true;
    setError('Live screening is not connected yet. Deploy the included Node API and set VITE_API_BASE_URL in the frontend build. Saved reports and the audit vault remain available locally.');
    return false;
  };

  const handleScreen = async (request: ScreeningRequest) => {
    if (!requireApi()) return;
    setIsLoading(true); setError(null);
    try {
      // Evidence is intentionally empty until authoritative source adapters populate it.
      // The backend treats this as verification-incomplete rather than fabricating a clean result.
      const res = await apiFetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: request, evidence: [] }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || `Screening request failed with status: ${res.status}`);
      const report = payload as VerificationReport;
      setCurrentReport(report);
      persistReports([report, ...savedReports.filter(r => r.reportId !== report.reportId)]);
      setActiveTab('report');
    } catch (err: any) { setError(err.message || 'Failed to complete screening. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleUpdateReport = (updated: VerificationReport) => { setCurrentReport(updated); persistReports(savedReports.map(r => r.reportId === updated.reportId ? updated : r)); };
  const handleDeleteReport = (reportId: string) => { const next = savedReports.filter(r => r.reportId !== reportId); persistReports(next); if (currentReport?.reportId === reportId) { setCurrentReport(next[0] || null); if (!next.length) setActiveTab('screening'); } };
  const handleClearAll = () => { persistReports([]); setCurrentReport(null); setActiveTab('screening'); };
  const postMonitoring = async (path: string, body: object) => { if (!requireApi()) return null; return apiFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); };
  const handleRefreshScan = async (subjectId?: string) => { try { setIsMonitoringLoading(true); const res = await postMonitoring('/api/monitoring/scan', { subjectId }); if (res?.ok) { const d = await res.json(); if (d.subjects) setMonitoredSubjects(d.subjects); if (d.alerts) setMonitoringAlerts(d.alerts); } } finally { setIsMonitoringLoading(false); } };
  const handleToggleMonitoring = async (subjectId: string) => { const res = await postMonitoring('/api/monitoring/toggle', { subjectId }); if (res?.ok) { const d = await res.json(); setMonitoredSubjects(p => p.map(s => s.id === subjectId ? d.subject : s)); } };
  const handleAcknowledgeAlert = async (alertId: string, officerName: string, actionNote: string) => { const res = await postMonitoring('/api/monitoring/acknowledge-alert', { alertId, officerName, actionNote }); if (res?.ok) { const d = await res.json(); setMonitoringAlerts(p => p.map(a => a.id === alertId ? d.alert : a)); } };
  const handleSimulateEvent = async (subjectId?: string, headline?: string, severity?: string) => { const res = await postMonitoring('/api/monitoring/simulate-feed-event', { subjectId, customHeadline: headline, severity }); if (res?.ok) { const d = await res.json(); if (d.alerts) setMonitoringAlerts(d.alerts); if (d.subject) setMonitoredSubjects(p => p.map(s => s.id === d.subject.id ? d.subject : s)); } };
  const handleEnrollInMonitoring = async (report: VerificationReport) => { const res = await postMonitoring('/api/monitoring/enroll', { subjectName: report.subject.name, subjectType: report.subject.subjectType, jurisdiction: report.subject.jurisdiction, reportId: report.reportId, initialRiskScore: report.riskAnalysis.compositeScore, riskLevel: report.riskAnalysis.riskLevel, linkedRegistryId: report.linkedEntityProfile?.externalId || 'GLEIF / Wikidata Profile' }); if (res?.ok) { const d = await res.json(); if (!d.alreadyEnrolled) setMonitoredSubjects(p => [d.subject, ...p]); handleUpdateReport({ ...report, isMonitored: true }); setActiveTab('monitoring'); } };

  const unackAlertsCount = monitoringAlerts.filter(a => !a.acknowledged).length;

  return <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
    <Header activeTab={activeTab} setActiveTab={setActiveTab} currentReport={currentReport} savedReportsCount={savedReports.length} unacknowledgedAlertsCount={unackAlertsCount} onNewScreening={() => setActiveTab('screening')} />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!HAS_REMOTE_API && <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/><span><strong>Frontend preview:</strong> the interface is deployed correctly, but live AML screening and monitoring require the secure server API. Configure <code>VITE_API_BASE_URL</code> for production before relying on screening results.</span></div>}
      {error && <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between"><div className="flex items-center space-x-2"><AlertTriangle className="w-4 h-4 shrink-0 text-red-400"/><span>{error}</span></div><button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-4">&times;</button></div>}
      {activeTab === 'screening' && <div className="space-y-6"><ScreeningForm onScreen={handleScreen} isLoading={isLoading}/></div>}
      <Suspense fallback={<ViewFallback/>}>
        {activeTab === 'report' && currentReport && <div className="space-y-8"><ExecutiveRiskBanner report={currentReport} onOpenSignOff={() => setIsSignOffOpen(true)}/><EntityLinkingSection linkedProfile={currentReport.linkedEntityProfile} report={currentReport} onEnrollInMonitoring={handleEnrollInMonitoring} isEnrolledInMonitoring={monitoredSubjects.some(s => s.subjectName.toLowerCase() === currentReport.subject.name.toLowerCase() && s.monitoringStatus !== 'PAUSED')}/><RiskBreakdownChart riskAnalysis={currentReport.riskAnalysis}/><AdverseMediaSection items={currentReport.adverseMediaItems} groundingSources={currentReport.groundingSources}/><SanctionsPepSection sanctionsHits={currentReport.sanctionsHits} pepHit={currentReport.pepHit}/><TypologiesSection typologies={currentReport.riskAnalysis.detectedTypologies}/><RegulatorySection actions={currentReport.regulatoryActions}/><MitigationAndAuditSection report={currentReport} onUpdateReport={handleUpdateReport} isSignOffOpen={isSignOffOpen} setIsSignOffOpen={setIsSignOffOpen}/></div>}
        {activeTab === 'sentiment' && currentReport && <SentimentDeepDiveView report={currentReport}/>} 
        {activeTab === 'monitoring' && <LiveNewsMonitoringView subjects={monitoredSubjects} alerts={monitoringAlerts} isLoading={isMonitoringLoading} onRefreshScan={handleRefreshScan} onToggleMonitoring={handleToggleMonitoring} onAcknowledgeAlert={handleAcknowledgeAlert} onSimulateEvent={handleSimulateEvent} onViewReportDossier={(repId) => { const matched = savedReports.find(r => r.reportId === repId); if (matched) { setCurrentReport(matched); setActiveTab('report'); } }}/>} 
        {activeTab === 'vault' && <HistoricalReportsList reports={savedReports} onSelectReport={(report) => { setCurrentReport(report); setActiveTab('report'); }} onDeleteReport={handleDeleteReport} onClearAll={handleClearAll}/>} 
        {currentReport && <OfficialPrintDossier report={currentReport}/>} 
      </Suspense>
    </main>
    <footer className="no-print mt-16 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500"><div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2"><div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-indigo-400"/><span>VeritasScreen Compliance Intelligence — Regulatory Screening Suite</span></div><div className="text-[11px] text-slate-600">Decision-support prototype • Compliance officer review required</div></div></footer>
  </div>;
}
