import { ScreeningRequest } from '../types';
import { nvidiaStructuredJson } from './nvidiaNim';

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
    detectedTypologies: Array<{ name: string; description: string; riskWeight: 'HIGH' | 'MEDIUM' | 'LOW'; indicator: string }>;
  };
  sanctionsHits: Array<{ evidenceId: string; listName: string; matchedName: string; matchConfidence: number; matchType: 'EXACT' | 'FUZZY_HIGH' | 'PARTIAL' | 'FALSE_POSITIVE'; reason: string; status: 'ACTIVE' | 'HISTORIC' | 'CLEARED' | 'UNKNOWN'; sourceUrl?: string }>;
  pepAssessment: { evidenceId?: string; isPEP: boolean | null; role?: string; country?: string; riskJustification: string };
  adverseMediaItems: Array<{ evidenceId: string; title: string; source: string; sourceUrl?: string; summary: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; relevanceScore: number }>;
  regulatoryActions: Array<{ evidenceId: string; authority: string; violation: string; status: string; sourceUrl?: string }>;
  recommendedMitigationSteps: string[];
  evidenceUsed: string[];
  verificationGaps: string[];
}

const ANALYSIS_SCHEMA: Record<string, unknown> = {
  type: 'object', additionalProperties: false,
  required: ['evidenceStatus','complianceRecommendation','recommendationRationale','executiveSummary','keyFindings','riskAnalysis','sanctionsHits','pepAssessment','adverseMediaItems','regulatoryActions','recommendedMitigationSteps','evidenceUsed','verificationGaps'],
  properties: {
    evidenceStatus: { type: 'string', enum: ['SUFFICIENT_FOR_ANALYSIS','INSUFFICIENT_REQUIRES_VERIFICATION'] },
    complianceRecommendation: { type: 'string', enum: ['PASS','PASS_WITH_MONITORING','ENHANCED_DUE_DILIGENCE','REJECT_BLOCK'] },
    recommendationRationale: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array', items: { type: 'string' } },
    riskAnalysis: { type: 'object', additionalProperties: false, required: ['compositeScore','riskLevel','subScores','detectedTypologies'], properties: {
      compositeScore: { type: 'number', minimum: 0, maximum: 100 }, riskLevel: { type: 'string', enum: ['LOW','MEDIUM','HIGH','CRITICAL'] },
      subScores: { type: 'object', additionalProperties: false, required: ['adverseMedia','sanctionsWatchlist','pepExposure','financialCrimeFraud','jurisdictionRisk','opacityStructure'], properties: { adverseMedia:{type:'number'}, sanctionsWatchlist:{type:'number'}, pepExposure:{type:'number'}, financialCrimeFraud:{type:'number'}, jurisdictionRisk:{type:'number'}, opacityStructure:{type:'number'} } },
      detectedTypologies: { type:'array', items:{ type:'object', additionalProperties:false, required:['name','description','riskWeight','indicator'], properties:{ name:{type:'string'}, description:{type:'string'}, riskWeight:{type:'string',enum:['HIGH','MEDIUM','LOW']}, indicator:{type:'string'} } } }
    } },
    sanctionsHits: { type:'array', items:{ type:'object', additionalProperties:false, required:['evidenceId','listName','matchedName','matchConfidence','matchType','reason','status'], properties:{ evidenceId:{type:'string'}, listName:{type:'string'}, matchedName:{type:'string'}, matchConfidence:{type:'number'}, matchType:{type:'string',enum:['EXACT','FUZZY_HIGH','PARTIAL','FALSE_POSITIVE']}, reason:{type:'string'}, status:{type:'string',enum:['ACTIVE','HISTORIC','CLEARED','UNKNOWN']}, sourceUrl:{type:'string'} } } },
    pepAssessment: { type:'object', additionalProperties:false, required:['isPEP','riskJustification'], properties:{ evidenceId:{type:'string'}, isPEP:{type:['boolean','null']}, role:{type:'string'}, country:{type:'string'}, riskJustification:{type:'string'} } },
    adverseMediaItems: { type:'array', items:{ type:'object', additionalProperties:false, required:['evidenceId','title','source','summary','severity','relevanceScore'], properties:{ evidenceId:{type:'string'}, title:{type:'string'}, source:{type:'string'}, sourceUrl:{type:'string'}, summary:{type:'string'}, severity:{type:'string',enum:['CRITICAL','HIGH','MEDIUM','LOW']}, relevanceScore:{type:'number'} } } },
    regulatoryActions: { type:'array', items:{ type:'object', additionalProperties:false, required:['evidenceId','authority','violation','status'], properties:{ evidenceId:{type:'string'}, authority:{type:'string'}, violation:{type:'string'}, status:{type:'string'}, sourceUrl:{type:'string'} } } },
    recommendedMitigationSteps:{type:'array',items:{type:'string'}}, evidenceUsed:{type:'array',items:{type:'string'}}, verificationGaps:{type:'array',items:{type:'string'}}
  }
};

function clampScore(value: unknown): number { const n = typeof value === 'number' ? value : Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0; }
function incompleteAnalysis(subject: ScreeningRequest, gaps = ['Sanctions verification','PEP verification','Regulatory verification','Registry/entity verification','Adverse-media verification']): NvidiaScreeningAnalysis { return { evidenceStatus:'INSUFFICIENT_REQUIRES_VERIFICATION', complianceRecommendation:'ENHANCED_DUE_DILIGENCE', recommendationRationale:'Attributable screening evidence is incomplete. The system cannot conclude that the subject is clear.', executiveSummary:`No evidence-backed screening conclusion can be produced for ${subject.name}. Official-source verification is required.`, keyFindings:['Screening evidence is incomplete; absence of evidence is not a clean result.'], riskAnalysis:{ compositeScore:50, riskLevel:'MEDIUM', subScores:{adverseMedia:0,sanctionsWatchlist:0,pepExposure:0,financialCrimeFraud:0,jurisdictionRisk:0,opacityStructure:0}, detectedTypologies:[] }, sanctionsHits:[], pepAssessment:{isPEP:null,riskJustification:'PEP status has not been verified from supplied evidence.'}, adverseMediaItems:[], regulatoryActions:[], recommendedMitigationSteps:['Complete authoritative sanctions and PEP verification.','Obtain attributable registry, regulatory and adverse-media evidence before making an onboarding decision.'], evidenceUsed:[], verificationGaps:gaps }; }
function sourceCoverage(evidence: ScreeningEvidenceItem[]): string[] { const types = new Set(evidence.map(e => e.sourceType)); const gaps:string[]=[]; if(!types.has('SANCTIONS'))gaps.push('Sanctions verification'); if(!types.has('PEP'))gaps.push('PEP verification'); if(!types.has('REGULATORY'))gaps.push('Regulatory verification'); if(!types.has('REGISTRY'))gaps.push('Registry/entity verification'); if(!types.has('ADVERSE_MEDIA'))gaps.push('Adverse-media verification'); return gaps; }

export async function analyzeWithNvidia(subject: ScreeningRequest, evidence: ScreeningEvidenceItem[]): Promise<NvidiaScreeningAnalysis> {
  if (!Array.isArray(evidence) || evidence.length === 0) return incompleteAnalysis(subject);
  const coverageGaps = sourceCoverage(evidence);
  const evidencePayload = evidence.map(item => ({ id:item.id, sourceType:item.sourceType, sourceName:item.sourceName, sourceUrl:item.sourceUrl||null, publishedAt:item.publishedAt||null, retrievedAt:item.retrievedAt, text:item.text.slice(0,12000) }));
  const prompt = `Analyze the subject strictly against the supplied evidence bundle.\n\nSUBJECT:\n${JSON.stringify(subject,null,2)}\n\nEVIDENCE BUNDLE:\n${JSON.stringify(evidencePayload,null,2)}\n\nRules:\n- Every sanctions hit, adverse-media item, PEP conclusion, and regulatory action must reference an evidenceId from the bundle.\n- Never create facts or URLs absent from the evidence.\n- A missing hit is not a clean result unless evidence explicitly documents a completed authoritative check.\n- When identity resolution is uncertain, require manual verification.\n- PASS is prohibited when source coverage is incomplete.\n- Return JSON only.`;
  const result = await nvidiaStructuredJson<NvidiaScreeningAnalysis>(prompt, ANALYSIS_SCHEMA, 8192);
  if (!result || typeof result !== 'object' || !result.riskAnalysis?.subScores) return incompleteAnalysis(subject, coverageGaps);
  const validEvidenceIds = new Set(evidence.map(item => item.id));
  result.evidenceUsed = Array.isArray(result.evidenceUsed) ? result.evidenceUsed.filter(id => validEvidenceIds.has(id)) : [];
  result.sanctionsHits = Array.isArray(result.sanctionsHits) ? result.sanctionsHits.filter(hit => validEvidenceIds.has(hit.evidenceId)) : [];
  result.adverseMediaItems = Array.isArray(result.adverseMediaItems) ? result.adverseMediaItems.filter(item => validEvidenceIds.has(item.evidenceId)) : [];
  result.regulatoryActions = Array.isArray(result.regulatoryActions) ? result.regulatoryActions.filter(item => validEvidenceIds.has(item.evidenceId)) : [];
  if (result.pepAssessment?.evidenceId && !validEvidenceIds.has(result.pepAssessment.evidenceId)) result.pepAssessment = { isPEP:null, riskJustification:'The model returned an unsupported PEP evidence reference; manual verification is required.' };
  result.riskAnalysis.compositeScore = clampScore(result.riskAnalysis.compositeScore);
  for (const key of Object.keys(result.riskAnalysis.subScores)) { const scores=result.riskAnalysis.subScores as unknown as Record<string,number>; scores[key]=clampScore(scores[key]); }
  result.verificationGaps = Array.from(new Set([...(Array.isArray(result.verificationGaps)?result.verificationGaps:[]),...coverageGaps]));
  if (coverageGaps.length > 0) { result.evidenceStatus='INSUFFICIENT_REQUIRES_VERIFICATION'; if(result.complianceRecommendation==='PASS') result.complianceRecommendation='ENHANCED_DUE_DILIGENCE'; result.recommendationRationale=`${result.recommendationRationale} Verification remains incomplete: ${coverageGaps.join(', ')}.`; }
  return result;
}
