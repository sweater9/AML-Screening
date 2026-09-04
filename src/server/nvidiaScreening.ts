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

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    evidenceStatus: { enum: ['SUFFICIENT_FOR_ANALYSIS', 'INSUFFICIENT_REQUIRES_VERIFICATION'] },
    complianceRecommendation: { enum: ['PASS', 'PASS_WITH_MONITORING', 'ENHANCED_DUE_DILIGENCE', 'REJECT_BLOCK'] },
    recommendationRationale: { type: 'string' },
    executiveSummary: { type: 'string' },
    keyFindings: { type: 'array', items: { type: 'string' } },
    riskAnalysis: {
      type: 'object', additionalProperties: false,
      properties: {
        compositeScore: { type: 'number', minimum: 0, maximum: 100 },
        riskLevel: { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        subScores: {
          type: 'object', additionalProperties: false,
          properties: {
            adverseMedia: { type: 'number', minimum: 0, maximum: 100 }, sanctionsWatchlist: { type: 'number', minimum: 0, maximum: 100 },
            pepExposure: { type: 'number', minimum: 0, maximum: 100 }, financialCrimeFraud: { type: 'number', minimum: 0, maximum: 100 },
            jurisdictionRisk: { type: 'number', minimum: 0, maximum: 100 }, opacityStructure: { type: 'number', minimum: 0, maximum: 100 },
          },
          required: ['adverseMedia', 'sanctionsWatchlist', 'pepExposure', 'financialCrimeFraud', 'jurisdictionRisk', 'opacityStructure'],
        },
        detectedTypologies: { type: 'array', items: { type: 'object' } },
      }, required: ['compositeScore', 'riskLevel', 'subScores', 'detectedTypologies'],
    },
    sanctionsHits: { type: 'array', items: { type: 'object' } },
    pepAssessment: { type: 'object' }, adverseMediaItems: { type: 'array', items: { type: 'object' } }, regulatoryActions: { type: 'array', items: { type: 'object' } },
    recommendedMitigationSteps: { type: 'array', items: { type: 'string' } }, evidenceUsed: { type: 'array', items: { type: 'string' } }, verificationGaps: { type: 'array', items: { type: 'string' } },
  },
  required: ['evidenceStatus', 'complianceRecommendation', 'recommendationRationale', 'executiveSummary', 'keyFindings', 'riskAnalysis', 'sanctionsHits', 'pepAssessment', 'adverseMediaItems', 'regulatoryActions', 'recommendedMitigationSteps', 'evidenceUsed', 'verificationGaps'],
} as const;

function clampScore(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function incompleteAnalysis(subject: ScreeningRequest, gaps?: string[]): NvidiaScreeningAnalysis {
  return {
    evidenceStatus: 'INSUFFICIENT_REQUIRES_VERIFICATION', complianceRecommendation: 'ENHANCED_DUE_DILIGENCE',
    recommendationRationale: 'Attributable evidence is incomplete. The system cannot conclude that the subject is clear.',
    executiveSummary: `No evidence-backed screening conclusion can be produced for ${subject.name}. Official-source verification is required.`,
    keyFindings: ['Screening evidence is incomplete; absence of a supplied hit must not be interpreted as a clear result.'],
    riskAnalysis: { compositeScore: 50, riskLevel: 'MEDIUM', subScores: { adverseMedia: 0, sanctionsWatchlist: 0, pepExposure: 0, financialCrimeFraud: 0, jurisdictionRisk: 0, opacityStructure: 0 }, detectedTypologies: [] },
    sanctionsHits: [], pepAssessment: { isPEP: null, riskJustification: 'PEP status has not been verified from supplied evidence.' }, adverseMediaItems: [], regulatoryActions: [],
    recommendedMitigationSteps: ['Verify the subject against authoritative sanctions and PEP sources.', 'Obtain attributable registry, regulatory, and adverse-media evidence before making an onboarding decision.'],
    evidenceUsed: [], verificationGaps: gaps?.length ? gaps : ['Sanctions verification', 'PEP verification', 'Regulatory verification', 'Registry/entity verification', 'Adverse-media verification'],
  };
}

function sourceCoverage(evidence: ScreeningEvidenceItem[]) {
  const types = new Set(evidence.map(item => item.sourceType));
  const gaps: string[] = [];
  if (!types.has('SANCTIONS')) gaps.push('Sanctions verification');
  if (!types.has('PEP')) gaps.push('PEP verification');
  if (!types.has('REGULATORY')) gaps.push('Regulatory verification');
  if (!types.has('REGISTRY')) gaps.push('Registry/entity verification');
  if (!types.has('ADVERSE_MEDIA')) gaps.push('Adverse-media verification');
  return gaps;
}

export async function analyzeWithNvidia(subject: ScreeningRequest, evidence: ScreeningEvidenceItem[]): Promise<NvidiaScreeningAnalysis> {
  if (!Array.isArray(evidence) || evidence.length === 0) return incompleteAnalysis(subject);

  const coverageGaps = sourceCoverage(evidence);
  const evidencePayload = evidence.map(item => ({ id: item.id, sourceType: item.sourceType, sourceName: item.sourceName, sourceUrl: item.sourceUrl || null, publishedAt: item.publishedAt || null, retrievedAt: item.retrievedAt, text: item.text.slice(0, 12000) }));
  const prompt = `Analyze the subject strictly against the supplied evidence bundle.\n\nSUBJECT:\n${JSON.stringify(subject, null, 2)}\n\nEVIDENCE BUNDLE:\n${JSON.stringify(evidencePayload, null, 2)}\n\nRules:\n- Every sanctions hit, adverse-media item, PEP conclusion, and regulatory action must reference an evidenceId from the bundle.\n- Never create a URL, identifier, designation, allegation, date, role, conviction, enforcement action, or registry record absent from the evidence.\n- A missing hit is not a clean result unless evidence explicitly documents a completed authoritative check.\n- When identity resolution is uncertain, require manual verification.\n- PASS is prohibited when sanctions, PEP, regulatory, registry, or adverse-media source coverage is incomplete.\n- Return JSON only.`;

  const result = await nvidiaJson<NvidiaScreeningAnalysis>(prompt, 8192, ANALYSIS_SCHEMA);
  if (!result || typeof result !== 'object' || !result.riskAnalysis?.subScores) return incompleteAnalysis(subject, coverageGaps);

  const validEvidenceIds = new Set(evidence.map(item => item.id));
  result.evidenceUsed = Array.isArray(result.evidenceUsed) ? result.evidenceUsed.filter(id => validEvidenceIds.has(id)) : [];
  result.sanctionsHits = Array.isArray(result.sanctionsHits) ? result.sanctionsHits.filter(hit => validEvidenceIds.has(hit.evidenceId)) : [];
  result.adverseMediaItems = Array.isArray(result.adverseMediaItems) ? result.adverseMediaItems.filter(item => validEvidenceIds.has(item.evidenceId)) : [];
  result.regulatoryActions = Array.isArray(result.regulatoryActions) ? result.regulatoryActions.filter(item => validEvidenceIds.has(item.evidenceId)) : [];
  if (result.pepAssessment?.evidenceId && !validEvidenceIds.has(result.pepAssessment.evidenceId)) result.pepAssessment = { isPEP: null, riskJustification: 'The model returned an unsupported PEP evidence reference; manual verification is required.' };

  result.riskAnalysis.compositeScore = clampScore(result.riskAnalysis.compositeScore);
  for (const key of Object.keys(result.riskAnalysis.subScores)) { const scores = result.riskAnalysis.subScores as unknown as Record<string, number>; scores[key] = clampScore(scores[key]); }

  result.verificationGaps = Array.from(new Set([...(Array.isArray(result.verificationGaps) ? result.verificationGaps : []), ...coverageGaps]));
  if (coverageGaps.length > 0) {
    result.evidenceStatus = 'INSUFFICIENT_REQUIRES_VERIFICATION';
    if (result.complianceRecommendation === 'PASS') result.complianceRecommendation = 'ENHANCED_DUE_DILIGENCE';
  }
  return result;
}
