import React, { useState, useEffect, useCallback } from 'react';
import { ScreeningRequest, VerificationReport, MonitoredSubject, MonitoringAlert } from './types';
import { Header } from './components/Header';
import { ScreeningForm } from './components/ScreeningForm';
import { ExecutiveRiskBanner } from './components/ExecutiveRiskBanner';
import { EntityLinkingSection } from './components/EntityLinkingSection';
import { LiveNewsMonitoringView } from './components/LiveNewsMonitoringView';
import { RiskBreakdownChart } from './components/RiskBreakdownChart';
import { AdverseMediaSection } from './components/AdverseMediaSection';
import { SanctionsPepSection } from './components/SanctionsPepSection';
import { TypologiesSection } from './components/TypologiesSection';
import { RegulatorySection } from './components/RegulatorySection';
import { MitigationAndAuditSection } from './components/MitigationAndAuditSection';
import { HistoricalReportsList } from './components/HistoricalReportsList';
import { OfficialPrintDossier } from './components/OfficialPrintDossier';
import { SentimentDeepDiveView } from './components/SentimentDeepDiveView';
import { SCREENING_PRESETS } from './data/presets';
import { AlertTriangle, ShieldCheck, Search, FileText } from 'lucide-react';

const STORAGE_KEY = 'veritas_screen_reports_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'screening' | 'report' | 'sentiment' | 'vault' | 'monitoring'>('screening');
  const [currentReport, setCurrentReport] = useState<VerificationReport | null>(null);
  const [savedReports, setSavedReports] = useState<VerificationReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignOffOpen, setIsSignOffOpen] = useState<boolean>(false);

  // Continuous Real-Time Monitoring State
  const [monitoredSubjects, setMonitoredSubjects] = useState<MonitoredSubject[]>([]);
  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringAlert[]>([]);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState<boolean>(false);

  // Load past reports from localStorage on mount
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
    } catch (e) {
      console.warn('Failed to parse saved reports from localStorage:', e);
    }
  }, []);

  // Fetch initial real-time monitoring subjects & alerts from backend
  const fetchMonitoringData = useCallback(async () => {
    try {
      const [subsRes, alertsRes] = await Promise.all([
        fetch('/api/monitoring/subjects'),
        fetch('/api/monitoring/alerts')
      ]);

      if (subsRes.ok && alertsRes.ok) {
        const subsData = await subsRes.json();
        const alertsData = await alertsRes.json();
        if (subsData.subjects) setMonitoredSubjects(subsData.subjects);
        if (alertsData.alerts) setMonitoringAlerts(alertsData.alerts);
      }
    } catch (e) {
      console.warn('Failed to fetch monitoring telemetry data:', e);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Save reports to localStorage
  const persistReports = (reports: VerificationReport[]) => {
    setSavedReports(reports);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to persist reports to localStorage:', e);
    }
  };

  const handleScreen = async (request: ScreeningRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error(`Screening request failed with status: ${res.status}`);
      }

      const report: VerificationReport = await res.json();
      setCurrentReport(report);

      // Add to saved reports, avoid duplicates by ID
      const updated = [report, ...savedReports.filter((r) => r.reportId !== report.reportId)];
      persistReports(updated);

      // Switch to report view
      setActiveTab('report');
    } catch (err: any) {
      console.warn('Screening execution notice:', err);
      setError(err.message || 'Failed to complete screening. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReport = (updated: VerificationReport) => {
    setCurrentReport(updated);
    const newReports = savedReports.map((r) => (r.reportId === updated.reportId ? updated : r));
    persistReports(newReports);
  };

  const handleDeleteReport = (reportId: string) => {
    const newReports = savedReports.filter((r) => r.reportId !== reportId);
    persistReports(newReports);
    if (currentReport?.reportId === reportId) {
      setCurrentReport(newReports.length > 0 ? newReports[0] : null);
      if (newReports.length === 0) {
        setActiveTab('screening');
      }
    }
  };

  const handleClearAll = () => {
    persistReports([]);
    setCurrentReport(null);
    setActiveTab('screening');
  };

  // Real-Time News Radar Action Handlers
  const handleRefreshScan = async (subjectId?: string) => {
    try {
      setIsMonitoringLoading(true);
      const res = await fetch('/api/monitoring/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subjects) setMonitoredSubjects(data.subjects);
        if (data.alerts) setMonitoringAlerts(data.alerts);
      }
    } catch (err) {
      console.warn('Notice during monitoring scan:', err);
    } finally {
      setIsMonitoringLoading(false);
    }
  };

  const handleToggleMonitoring = async (subjectId: string) => {
    try {
      const res = await fetch('/api/monitoring/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMonitoredSubjects((prev) =>
          prev.map((s) => (s.id === subjectId ? data.subject : s))
        );
      }
    } catch (err) {
      console.warn('Notice during toggle monitoring:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string, officerName: string, actionNote: string) => {
    try {
      const res = await fetch('/api/monitoring/acknowledge-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, officerName, actionNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setMonitoringAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? data.alert : a))
        );
      }
    } catch (err) {
      console.warn('Notice during acknowledge alert:', err);
    }
  };

  const handleSimulateEvent = async (subjectId?: string, headline?: string, severity?: string) => {
    try {
      const res = await fetch('/api/monitoring/simulate-feed-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, customHeadline: headline, severity }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alerts) setMonitoringAlerts(data.alerts);
        if (data.subject) {
          setMonitoredSubjects((prev) =>
            prev.map((s) => (s.id === data.subject.id ? data.subject : s))
          );
        }
      }
    } catch (err) {
      console.warn('Notice during simulate feed event:', err);
    }
  };

  const handleEnrollInMonitoring = async (report: VerificationReport) => {
    try {
      const res = await fetch('/api/monitoring/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: report.subject.name,
          subjectType: report.subject.subjectType,
          jurisdiction: report.subject.jurisdiction,
          reportId: report.reportId,
          initialRiskScore: report.riskAnalysis.compositeScore,
          riskLevel: report.riskAnalysis.riskLevel,
          linkedRegistryId: report.linkedEntityProfile?.externalId || 'GLEIF / Wikidata Profile',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.alreadyEnrolled) {
          setMonitoredSubjects((prev) => [data.subject, ...prev]);
        }
        // Mark report as monitored in local state
        const updated = { ...report, isMonitored: true };
        handleUpdateReport(updated);
        // Switch to monitoring tab
        setActiveTab('monitoring');
      }
    } catch (err) {
      console.warn('Notice during enroll subject in monitoring:', err);
    }
  };

  const unackAlertsCount = monitoringAlerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentReport={currentReport}
        savedReportsCount={savedReports.length}
        unacknowledgedAlertsCount={unackAlertsCount}
        onNewScreening={() => setActiveTab('screening')}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white font-bold ml-4"
            >
              &times;
            </button>
          </div>
        )}

        {/* VIEW 1: Screening Console */}
        {activeTab === 'screening' && (
          <div className="space-y-6">
            <ScreeningForm onScreen={handleScreen} isLoading={isLoading} />
          </div>
        )}

        {/* VIEW 2: Full Verification Report & Dossier */}
        {activeTab === 'report' && currentReport && (
          <div className="space-y-8">
            {/* Executive Risk Banner */}
            <ExecutiveRiskBanner
              report={currentReport}
              onOpenSignOff={() => setIsSignOffOpen(true)}
            />

            {/* Advanced Entity Linking & Disambiguation Card */}
            <EntityLinkingSection
              linkedProfile={currentReport.linkedEntityProfile}
              report={currentReport}
              onEnrollInMonitoring={handleEnrollInMonitoring}
              isEnrolledInMonitoring={monitoredSubjects.some(
                (s) =>
                  s.subjectName.toLowerCase() === currentReport.subject.name.toLowerCase() &&
                  s.monitoringStatus !== 'PAUSED'
              )}
            />

            {/* Multidimensional Risk Factors & Sentiment Overview */}
            <RiskBreakdownChart riskAnalysis={currentReport.riskAnalysis} />

            {/* Adverse Media Section */}
            <AdverseMediaSection
              items={currentReport.adverseMediaItems}
              groundingSources={currentReport.groundingSources}
            />

            {/* Sanctions & PEP Cross-Reference Section */}
            <SanctionsPepSection
              sanctionsHits={currentReport.sanctionsHits}
              pepHit={currentReport.pepHit}
            />

            {/* Typologies & Red Flags */}
            <TypologiesSection typologies={currentReport.riskAnalysis.detectedTypologies} />

            {/* Regulatory Actions */}
            <RegulatorySection actions={currentReport.regulatoryActions} />

            {/* Mitigation Steps & Audit Trail */}
            <MitigationAndAuditSection
              report={currentReport}
              onUpdateReport={handleUpdateReport}
              isSignOffOpen={isSignOffOpen}
              setIsSignOffOpen={setIsSignOffOpen}
            />
          </div>
        )}

        {/* VIEW 3: Adverse Sentiment Deep-Dive */}
        {activeTab === 'sentiment' && currentReport && (
          <SentimentDeepDiveView report={currentReport} />
        )}

        {/* VIEW 4: Live News Feed Monitoring & Radar */}
        {activeTab === 'monitoring' && (
          <LiveNewsMonitoringView
            subjects={monitoredSubjects}
            alerts={monitoringAlerts}
            isLoading={isMonitoringLoading}
            onRefreshScan={handleRefreshScan}
            onToggleMonitoring={handleToggleMonitoring}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onSimulateEvent={handleSimulateEvent}
            onViewReportDossier={(repId) => {
              const matched = savedReports.find((r) => r.reportId === repId);
              if (matched) {
                setCurrentReport(matched);
                setActiveTab('report');
              }
            }}
          />
        )}

        {/* VIEW 5: Historical Audit Vault */}
        {activeTab === 'vault' && (
          <HistoricalReportsList
            reports={savedReports}
            onSelectReport={(report) => {
              setCurrentReport(report);
              setActiveTab('report');
            }}
            onDeleteReport={handleDeleteReport}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      {/* Official Print Dossier (Hidden in browser, rendered when window.print() is executed) */}
      {currentReport && <OfficialPrintDossier report={currentReport} />}

      {/* Minimal Footer */}
      <footer className="no-print mt-16 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>VeritasScreen Compliance Intelligence — Regulatory Screening Suite</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Compliant with FATF 40 Recommendations • US Bank Secrecy Act • EU 6AMLD Guidelines
          </div>
        </div>
      </footer>
    </div>
  );
}
