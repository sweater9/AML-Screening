import { ScreeningRequest } from '../types';
import { nvidiaJson } from './nvidiaNim';

export interface ScreeningEvidenceItem {
  id: string;
  sourceType: 'SANCTIONS' | 'PEP' | 'REGULATORY' | 'REGISTRY' | 'ADVERSE_MEDIA' | 'OTHER';
  sourceName: string;
  sourceUrl?: string;
  publishedAt?: string;
  retrievedAt: string;
  text: string;
}

export interface NvidiaScreeningAnalysis {
  evidenceStatus: 'SUFFICIENT_FOR_ANALYSIS' | 'INSUFFICIENT_REQUIRES_VERIFICATION';
  complianceRecommendation: 'PASS' | 'PASS_WITH_MONITORING' | 'ENHANCED_DUE_DILIGENCE' | 'REJECT_BLOCK';
  recommendationRationale: string;
  executiveSummary: string;
  keyFindings: string[];
  riskAnalysis: {
    compositeScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    subScores: {
      adverseMedia: number;
      sanctionsWatchlist: number;
      pepExposure: number;
      financialCrimeFraud: number;
      jurisdictionRisk: number;
      opacityStructure: number;
    };
    detectedTypologies: Array<{
      name: string;
      description: string;
      riskWeight: 'HIGH' | 'MEDIUM' | 'LOW';
      indicator: string;
    }>;
  };
  sanctionsHits: Array<{
    evidenceId: string;
    listName: string;
    matchedName: string;
    matchConfidence: number;
    matchType: 'EXACT' | 'FUZZY_HIGH' | 'PARTIAL' | 'FALSE_POSITIVE';
    reason: string;
    status: 'ACTIVE' | 'HISTORIC' | 'CLEARED' | 'UNKNOWN';
    sourceUrl?: string;
  }>;
  pepAssessment: {
    evidenceId?: string;
    isPEP: boolean | null;
    role?: string;
    country?: string;
    riskJustification: string;
  };
  adverseMediaItems: Array<{
    evidenceId: string;
    title: string;
    source: string;
    sourceUrl?: string;
    summary: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    relevanceScore: number;
  }>;
  regulatoryActions: Array<{
    evidenceId: string;
    authority: string;
    violation: string;
    status: string;
    sourceUrl?: string;
  }>;
  recommendedMitigationSteps: string[];
  evidenceUsed: string[];
  verificationGaps: string[];
}

function clampScore(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export async function analyzeWithNvidia(
  subject: ScreeningRequest,
  evidence: ScreeningEvidenceItem[],
): Promise<NvidiaScreeningAnalysis> {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return {
      evidenceStatus: 'INSUFFICIENT_REQUIRES_VERIFICATION',
      complianceRecommendation: 'ENHANCED_DUE_DILIGENCE',
      recommendationRationale: 'No attributable screening evidence was supplied. The system cannot conclude that the subject is clear.',
      executiveSummary: `No evidence-backed screening conclusion can be produced for ${subject.name}. Official-source verification is required.`,
      keyFindings: ['No attributable sanctions, PEP, regulatory, registry, or adverse-media evidence was supplied to the analysis engine.'],
      riskAnalysis: {
        compositeScore: 50,
        riskLevel: 'MEDIUM',
        subScores: { adverseMedia: 0, sanctionsWatchlist: 0, pepExposure: 0, financialCrimeFraud: 0, jurisdictionRisk: 0, opacityStructure: 0 },
        detectedTypologies: [],
      },
      sanctionsHits: [],
      pepAssessment: { isPEP: null, riskJustification: 'PEP status has not been verified from supplied evidence.' },
      adverseMediaItems: [],
      regulatoryActions: [],
      recommendedMitigationSteps: ['Verify the subject against authoritative sanctions and PEP sources.', 'Obtain attributable registry and adverse-media evidence before making an onboarding decision.'],
      evidenceUsed: [],
      verificationGaps: ['Sanctions verification', 'PEP verification', 'Regulatory verification', 'Registry/entity verification', 'Adverse-media verification'],
    };
  }

  const evidencePayload = evidence.map(item => ({
    id: item.id,
    sourceType: item.sourceType,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl || null,
    publishedAt: item.publishedAt || null,
    retrievedAt: item.retrievedAt,
    text: item.text.slice(0, 12000),
  }));

  const prompt = `Analyze the subject strictly against the supplied evidence bundle.

SUBJECT:\n${JSON.stringify(subject, null, 2)}

EVIDENCE BUNDLE:\n${JSON.stringify(evidencePayload, null, 2)}

Rules:
- Every sanctions hit, adverse-media item, PEP conclusion, and regulatory action must reference an evidenceId from the bundle.
- Never create a URL, identifier, designation, allegation, date, role, conviction, enforcement action, or registry record that is absent from the evidence.
- A missing hit is not a clean result unless the evidence explicitly documents a completed authoritative check.
- When identity resolution is uncertain, state the ambiguity and require manual verification.
- Use PASS only when supplied evidence supports a sufficiently complete negative screening. Otherwise prefer PASS_WITH_MONITORING or ENHANCED_DUE_DILIGENCE as appropriate.
- Return JSON only matching the requested analysis structure.`;

  const result = await nvidiaJson<NvidiaScreeningAnalysis>(prompt, 8192);
  const validEvidenceIds = new Set(evidence.map(item => item.id));

  result.evidenceUsed = Array.isArray(result.evidenceUsed)
    ? result.evidenceUsed.filter(id => validEvidenceIds.has(id))
    : [];
  result.sanctionsHits = Array.isArray(result.sanctionsHits)
    ? result.sanctionsHits.filter(hit => validEvidenceIds.has(hit.evidenceId))
    : [];
  result.adverseMediaItems = Array.isArray(result.adverseMediaItems)
    ? result.adverseMediaItems.filter(item => validEvidenceIds.has(item.evidenceId))
    : [];
  result.regulatoryActions = Array.isArray(result.regulatoryActions)
    ? result.regulatoryActions.filter(item => validEvidenceIds.has(item.evidenceId))
    : [];

  result.riskAnalysis.compositeScore = clampScore(result.riskAnalysis?.compositeScore);
  for (const key of Object.keys(result.riskAnalysis?.subScores || {})) {
    const scores = result.riskAnalysis.subScores as unknown as Record<string, number>;
    scores[key] = clampScore(scores[key]);
  }

  return result;
}
