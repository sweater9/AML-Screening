import React from 'react';
import { VerificationReport } from '../types';
import { formatDateTime, formatDate, getRecommendationBadge } from '../utils/complianceUtils';
import { ShieldCheck, Lock } from 'lucide-react';

interface OfficialPrintDossierProps {
  report: VerificationReport;
}

export const OfficialPrintDossier: React.FC<OfficialPrintDossierProps> = ({ report }) => {
  const recBadge = getRecommendationBadge(report.complianceRecommendation);

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6">
      {/* Official Header */}
      <div className="border-b-2 border-black pb-4 flex justify-between items-start">
        <div>
          <div className="text-xl font-extrabold uppercase tracking-wider text-black">
            VeritasScreen Compliance Intelligence
          </div>
          <div className="text-xs font-semibold uppercase text-gray-600 tracking-wider">
            Automated Background Verification & AML/CFT Due Diligence Dossier
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            Prepared in accordance with FATF 40 Recommendations, EU 6AMLD & USA PATRIOT Act
          </div>
        </div>
        <div className="text-right text-xs">
          <div>Report Ref: <strong className="font-mono">{report.reportId}</strong></div>
          <div>Date: {formatDateTime(report.generatedAt)}</div>
          <div className="text-[10px] text-gray-500 font-mono">Hash: {report.verificationHash.slice(0, 20)}...</div>
        </div>
      </div>

      {/* Target Subject Details */}
      <div className="border border-gray-300 rounded p-4 bg-gray-50 space-y-2 text-xs">
        <div className="font-bold uppercase tracking-wider text-gray-800 text-[11px] border-b border-gray-200 pb-1">
          Target Subject Identity
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><strong>Subject Name:</strong> {report.subject.name}</div>
          <div><strong>Subject Type:</strong> {report.subject.subjectType === 'individual' ? 'Natural Person' : 'Corporate Entity'}</div>
          <div><strong>Jurisdiction:</strong> {report.subject.jurisdiction}</div>
          <div><strong>DOB / Incorporation:</strong> {report.subject.dobOrIncorporationYear || 'Not provided'}</div>
          <div><strong>ID / Registration:</strong> {report.subject.idOrRegistrationNumber || 'Not provided'}</div>
          <div><strong>Profession / Industry:</strong> {report.subject.industryOrProfession || 'Not provided'}</div>
          <div className="col-span-2">
            <strong>Known Aliases (AKA):</strong> {report.subject.aliases?.join(', ') || 'None identified'}
          </div>
          <div className="col-span-2">
            <strong>Key Associates / UBOs:</strong> {report.subject.associatesOrKeyExecutives?.join(', ') || 'None identified'}
          </div>
        </div>
      </div>

      {/* Verified Registry Profile & Disambiguation */}
      {report.linkedEntityProfile && (
        <div className="border border-gray-300 rounded p-4 bg-gray-50 space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="font-bold uppercase tracking-wider text-gray-800 text-[11px]">
              Verified Registry Profile & Disambiguation Link
            </span>
            <span className="font-semibold text-gray-700 text-[10px]">
              {report.linkedEntityProfile.disambiguationStatus} ({report.linkedEntityProfile.disambiguationScore}% Confidence)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><strong>Verified Legal Name:</strong> {report.linkedEntityProfile.verifiedName}</div>
            <div><strong>Registry Source:</strong> {report.linkedEntityProfile.registrySource}</div>
            <div><strong>External ID:</strong> {report.linkedEntityProfile.externalId}</div>
            <div><strong>Entity Status:</strong> {report.linkedEntityProfile.entityStatus}</div>
            <div className="col-span-2 text-gray-700 italic text-[11px]">
              <strong>Disambiguation Rationale:</strong> {report.linkedEntityProfile.disambiguationNotes}
            </div>
          </div>
        </div>
      )}

      {/* Risk Summary Box */}
      <div className="border-2 border-black p-4 rounded bg-gray-100 flex justify-between items-center">
        <div>
          <div className="text-[11px] font-bold uppercase text-gray-700">Composite Risk Assessment</div>
          <div className="text-2xl font-black text-black">
            {report.riskAnalysis.compositeScore} / 100 — {report.riskAnalysis.riskLevel} RISK TIER
          </div>
          <div className="text-xs font-semibold text-gray-800 mt-1">
            Disposition: <span className="underline">{recBadge.label}</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-0.5">{recBadge.actionText}</div>
        </div>
        <div className="text-center p-3 border border-black rounded bg-white w-32">
          <div className="text-[9px] font-bold uppercase text-gray-500">Official Seal</div>
          <div className="text-xs font-bold text-black mt-1">VERIFIED</div>
          <div className="text-[8px] font-mono text-gray-400 mt-1">AML VERITAS</div>
        </div>
      </div>

      {/* Executive Briefing */}
      <div className="space-y-2 text-xs">
        <div className="font-bold uppercase tracking-wider text-black text-[11px] border-b border-gray-300 pb-1">
          Executive Compliance Briefing
        </div>
        <p className="text-gray-800 leading-relaxed text-xs">{report.executiveSummary}</p>
        {report.keyFindings && (
          <ul className="list-disc pl-4 text-gray-800 space-y-1 mt-2 text-xs">
            {report.keyFindings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Sanctions & Watchlists Table */}
      <div className="space-y-2 text-xs">
        <div className="font-bold uppercase tracking-wider text-black text-[11px] border-b border-gray-300 pb-1">
          Sanctions & Watchlist Findings ({report.sanctionsHits.length} Hits)
        </div>
        {report.sanctionsHits.length > 0 ? (
          <table className="w-full text-left text-xs border border-gray-300">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-2 border">Watchlist</th>
                <th className="p-2 border">Matched Name</th>
                <th className="p-2 border">Confidence</th>
                <th className="p-2 border">Program / Reason</th>
              </tr>
            </thead>
            <tbody>
              {report.sanctionsHits.map((h, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 border font-semibold">{h.listName}</td>
                  <td className="p-2 border">{h.matchedName}</td>
                  <td className="p-2 border">{h.matchConfidence}% ({h.matchType})</td>
                  <td className="p-2 border">{h.program} — {h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-2 text-gray-700 bg-gray-50 border border-gray-200">
            Negative Confirmation: Zero matches detected on OFAC SDN, UN, EU, UK OFSI, or Interpol registers.
          </div>
        )}
      </div>

      {/* Adverse Media Table */}
      <div className="space-y-2 text-xs">
        <div className="font-bold uppercase tracking-wider text-black text-[11px] border-b border-gray-300 pb-1">
          Adverse Media & Negative News Sentiment Analysis
        </div>
        {report.adverseMediaItems.length > 0 ? (
          <div className="space-y-2">
            {report.adverseMediaItems.slice(0, 5).map((item, i) => (
              <div key={i} className="border border-gray-300 p-2.5 rounded bg-gray-50 text-xs">
                <div className="flex justify-between font-bold">
                  <span>{item.title}</span>
                  <span>Sentiment: {item.sentimentScore} ({item.severity})</span>
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Source: {item.source} • Date: {formatDate(item.date)} • Categories: {item.categories?.join(', ')}
                </div>
                <div className="italic text-gray-800 mt-1">"{item.snippet}"</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 text-gray-700 bg-gray-50 border border-gray-200">
            No adverse media or financial crime records found.
          </div>
        )}
      </div>

      {/* Compliance Officer Adjudication & Signatures */}
      <div className="border-t-2 border-black pt-4 grid grid-cols-2 gap-6 text-xs mt-6">
        <div>
          <div className="font-bold uppercase text-[11px]">Investigating Officer</div>
          <div className="mt-1 font-semibold">{report.officerSignature || report.investigator}</div>
          <div className="text-gray-600 text-[10px] mt-0.5">Compliance Department / Risk Review</div>
          <div className="mt-4 border-b border-black w-48" />
          <div className="text-[10px] text-gray-500 mt-1">Signature & Date</div>
        </div>

        <div>
          <div className="font-bold uppercase text-[11px]">Compliance Committee Disposition</div>
          <div className="mt-1 font-semibold">{report.complianceRecommendation.replace('_', ' ')}</div>
          <div className="text-gray-700 text-[10px] italic mt-0.5">
            "{report.officerNotes || 'Adjudicated per standard CDD/EDD guidelines.'}"
          </div>
          <div className="mt-4 border-b border-black w-48" />
          <div className="text-[10px] text-gray-500 mt-1">Chief Compliance Officer (CCO)</div>
        </div>
      </div>
    </div>
  );
};
