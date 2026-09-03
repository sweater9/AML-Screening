import React, { useState } from 'react';
import { 
  Database, 
  Link2, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Layers, 
  Search, 
  Radio, 
  Info,
  Clock,
  UserX,
  FileBadge
} from 'lucide-react';
import { LinkedEntityProfile, VerificationReport } from '../types';

interface EntityLinkingSectionProps {
  linkedProfile?: LinkedEntityProfile;
  report: VerificationReport;
  onEnrollInMonitoring?: (report: VerificationReport) => void;
  isEnrolledInMonitoring?: boolean;
}

export const EntityLinkingSection: React.FC<EntityLinkingSectionProps> = ({
  linkedProfile,
  report,
  onEnrollInMonitoring,
  isEnrolledInMonitoring = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHomonyms, setShowHomonyms] = useState<boolean>(true);

  if (!linkedProfile) {
    return null;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: LinkedEntityProfile['disambiguationStatus']) => {
    switch (status) {
      case 'CONFIRMED_MATCH':
        return {
          label: 'CONFIRMED MATCH',
          bgColor: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'HIGH_CONFIDENCE_LINK':
        return {
          label: 'HIGH CONFIDENCE LINK',
          bgColor: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />,
        };
      case 'AMBIGUOUS_PARTIAL':
        return {
          label: 'AMBIGUOUS / MULTIPLE CANDIDATES',
          bgColor: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      default:
        return {
          label: 'UNLINKED PROFILE',
          bgColor: 'bg-slate-700/40 border-slate-600 text-slate-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const statusBadge = getStatusBadge(linkedProfile.disambiguationStatus);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Source Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Advanced Entity Linking & Registry Disambiguation
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.bgColor}`}>
                {statusBadge.icon}
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Resolved against official legal entity databases, corporate registries, and verified public figure graphs
            </p>
          </div>
        </div>

        {/* Monitoring Enroll Action */}
        <div className="flex items-center gap-2">
          {onEnrollInMonitoring && (
            <button
              onClick={() => onEnrollInMonitoring(report)}
              disabled={isEnrolledInMonitoring}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                isEnrolledInMonitoring
                  ? 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isEnrolledInMonitoring ? 'text-emerald-400 animate-pulse' : 'text-white'}`} />
              <span>{isEnrolledInMonitoring ? 'Continuous Radar Active' : 'Enroll in Real-Time Monitoring'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Resolution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Verified Identity Card */}
        <div className="lg:col-span-8 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Official Verified Legal Name
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h4 className="text-lg font-bold text-white tracking-tight">
                  {linkedProfile.verifiedName}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {linkedProfile.entityStatus}
                </span>
              </div>
            </div>

            {/* External ID Pill with 1-click Copy & Link */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 rounded-lg p-1.5">
              <span className="font-mono text-xs text-indigo-300 font-semibold px-1">
                {linkedProfile.externalId}
              </span>
              <button
                onClick={() => handleCopy(linkedProfile.externalId, 'primary-id')}
                title="Copy Official Registry Identifier"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              >
                {copiedId === 'primary-id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {linkedProfile.registryUrl && (
                <a
                  href={linkedProfile.registryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Official Database Registry"
                  className="p-1 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-800 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Key Attributes Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Primary Registry</span>
              <p className="font-medium text-slate-200 truncate mt-0.5">{linkedProfile.registrySource}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Registered Jurisdiction</span>
              <p className="font-medium text-slate-200 mt-0.5">{linkedProfile.registeredJurisdiction}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Date Established / DOB</span>
              <p className="font-medium text-slate-200 mt-0.5">{linkedProfile.incorporationOrBirthDate || 'Verified on Record'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium">Last Registry Sync</span>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                {new Date(linkedProfile.lastRegistrySync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </p>
            </div>
          </div>

          {/* Verified Identifiers List */}
          {linkedProfile.identifiers && linkedProfile.identifiers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileBadge className="w-3 h-3 text-indigo-400" />
                Multi-Registry Identifiers & Cross-References
              </span>
              <div className="flex flex-wrap gap-2">
                {linkedProfile.identifiers.map((ident, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-400">{ident.type}:</span>
                    <span className="text-slate-200 font-semibold">{ident.value}</span>
                    <span className="text-[10px] text-slate-500 font-sans">({ident.authority})</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Directorships / Corporate Roles */}
          {linkedProfile.verifiedRolesOrDirectorships && linkedProfile.verifiedRolesOrDirectorships.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-400" />
                Verified Corporate Roles & Directorships
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {linkedProfile.verifiedRolesOrDirectorships.map((role, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{role.role}</p>
                      <p className="text-[11px] text-slate-400">{role.entity} {role.jurisdiction ? `(${role.jurisdiction})` : ''}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      role.status === 'SANCTIONED' ? 'bg-red-950 text-red-300 border border-red-800' :
                      role.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {role.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Disambiguation Confidence & Forensic Notes */}
        <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Disambiguation Precision Score
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-white font-mono">
                {linkedProfile.disambiguationScore}%
              </span>
              <span className="text-xs text-emerald-400 font-semibold">Definitive Resolution</span>
            </div>

            {/* Progress meter */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" 
                style={{ width: `${linkedProfile.disambiguationScore}%` }} 
              />
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold text-[11px]">
                <Info className="w-3.5 h-3.5" />
                <span>Forensic Disambiguation Rationale</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {linkedProfile.disambiguationNotes}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
            <span>Verified Source Link:</span>
            <a
              href={linkedProfile.registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
            >
              Verify on {linkedProfile.registrySource.split(' ')[0]} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Homonym & Name Collision Exclusion Matrix */}
      {linkedProfile.candidateHomonyms && linkedProfile.candidateHomonyms.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Candidate Homonym & Namesake Exclusion Matrix ({linkedProfile.candidateHomonyms.length} Evaluated)
              </h4>
            </div>
            <button
              onClick={() => setShowHomonyms(!showHomonyms)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {showHomonyms ? 'Collapse Matrix' : 'Expand Matrix'}
            </button>
          </div>

          {showHomonyms && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Candidate Homonym</th>
                    <th className="py-2.5 px-3 font-semibold">Registry & Record ID</th>
                    <th className="py-2.5 px-3 font-semibold">Jurisdiction</th>
                    <th className="py-2.5 px-3 font-semibold">Similarity</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Forensic Exclusion Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {linkedProfile.candidateHomonyms.map((cand, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-200 whitespace-nowrap">
                        {cand.candidateName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {cand.candidateId} <span className="font-sans text-slate-500">({cand.registry})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {cand.jurisdiction}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {cand.similarityScore}%
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          {cand.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {cand.dismissalRationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
