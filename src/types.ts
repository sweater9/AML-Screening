export type SubjectType = 'individual' | 'entity';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplianceRecommendation = 
  | 'PASS' 
  | 'PASS_WITH_MONITORING' 
  | 'ENHANCED_DUE_DILIGENCE' 
  | 'REJECT_BLOCK';

export interface ScreeningScope {
  adverseMedia: boolean;
  sanctionsAndWatchlists: boolean;
  fraudAndFinancialCrime: boolean;
  pepCheck: boolean;
  mlTfTypologies: boolean;
  regulatoryEnforcement: boolean;
}

export interface ScreeningRequest {
  subjectType: SubjectType;
  name: string;
  aliases?: string[];
  jurisdiction: string;
  dobOrIncorporationYear?: string;
  idOrRegistrationNumber?: string;
  industryOrProfession?: string;
  associatesOrKeyExecutives?: string[];
  screeningScope: ScreeningScope;
  searchKeywordsOverride?: string;
}

export type SentimentLabel = 
  | 'NEGATIVE_CRITICAL' 
  | 'NEGATIVE_HIGH' 
  | 'NEGATIVE_MODERATE' 
  | 'NEUTRAL' 
  | 'POSITIVE';

export interface AdverseMediaItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date?: string;
  snippet: string;
  sentimentScore: number; // -100 to +100
  sentimentLabel: SentimentLabel;
  categories: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relevanceScore: number; // 0 - 100
  credibility: 'High' | 'Medium' | 'Low';
}

export interface SanctionsHit {
  listName: string;
  matchedName: string;
  matchConfidence: number; // 0 - 100
  matchType: 'EXACT' | 'FUZZY_HIGH' | 'PARTIAL' | 'FALSE_POSITIVE';
  reason: string;
  program: string;
  status: 'ACTIVE' | 'HISTORIC' | 'CLEARED';
  sourceUrl?: string;
}

export interface PEPHit {
  isPEP: boolean;
  pepTier: 'Tier 1 (Head of State / Minister)' | 'Tier 2 (Senior Judicial / Military / SOE)' | 'Tier 3 (Local / Regional)' | 'RCA (Relative / Close Associate)' | 'None';
  role?: string;
  country?: string;
  period?: string;
  riskJustification?: string;
}

export interface RegulatoryAction {
  authority: string;
  date?: string;
  violation: string;
  penalty?: string;
  status: string;
  sourceUrl?: string;
}

export interface MLTFTypology {
  name: string;
  description: string;
  riskWeight: 'HIGH' | 'MEDIUM' | 'LOW';
  indicator: string;
}

export interface SentimentBreakdown {
  overallSentiment: number; // -100 to +100
  negativePercent: number;
  neutralPercent: number;
  positivePercent: number;
  dominantThemes: string[];
}

export interface MLTFRiskAnalysis {
  compositeScore: number; // 0 - 100
  riskLevel: RiskLevel;
  subScores: {
    adverseMedia: number; // 0 - 100
    sanctionsWatchlist: number; // 0 - 100
    pepExposure: number; // 0 - 100
    financialCrimeFraud: number; // 0 - 100
    jurisdictionRisk: number; // 0 - 100
    opacityStructure: number; // 0 - 100
  };
  detectedTypologies: MLTFTypology[];
  sentimentBreakdown: SentimentBreakdown;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
}

export interface VerificationReport {
  reportId: string;
  generatedAt: string;
  investigator: string;
  subject: ScreeningRequest;
  riskAnalysis: MLTFRiskAnalysis;
  complianceRecommendation: ComplianceRecommendation;
  recommendationRationale: string;
  executiveSummary: string;
  keyFindings: string[];
  sanctionsHits: SanctionsHit[];
  pepHit: PEPHit;
  adverseMediaItems: AdverseMediaItem[];
  regulatoryActions: RegulatoryAction[];
  recommendedMitigationSteps: string[];
  auditTrail: AuditLogItem[];
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'ESCALATED' | 'BLOCKED';
  officerNotes?: string;
  officerDecision?: string;
  officerSignature?: string;
  verificationHash: string;
  groundingSources?: { title: string; url: string }[];
  linkedEntityProfile?: LinkedEntityProfile;
  isMonitored?: boolean;
  quotaNotice?: string;
  isSimulationMode?: boolean;
  monitoringId?: string;
}

// -------------------------------------------------------------
// Advanced Entity Linking & Disambiguation Types
// -------------------------------------------------------------
export type DisambiguationStatus = 
  | 'CONFIRMED_MATCH' 
  | 'HIGH_CONFIDENCE_LINK' 
  | 'AMBIGUOUS_PARTIAL' 
  | 'UNLINKED';

export interface EntityIdentifier {
  type: string; // e.g. 'LEI', 'Wikidata QID', 'SEC CIK', 'Company Registration No', 'OpenSanctions ID'
  value: string;
  authority: string; // e.g. 'GLEIF', 'Wikidata Foundation', 'UK Companies House', 'SEC EDGAR'
  verified: boolean;
}

export interface DirectorshipOrRole {
  role: string;
  entity: string;
  status: 'ACTIVE' | 'FORMER' | 'SANCTIONED';
  startDate?: string;
  endDate?: string;
  jurisdiction?: string;
}

export interface CandidateHomonym {
  candidateName: string;
  candidateId: string;
  registry: string;
  jurisdiction: string;
  similarityScore: number; // 0 - 100
  status: 'DISMISSED' | 'REVIEW_REQUIRED';
  dismissalRationale: string;
}

export interface LinkedEntityProfile {
  registrySource: string; // e.g. "Global Legal Entity Identifier (GLEIF)", "OpenCorporates Business Registry", "Wikidata Public Figure Knowledge Graph", "SEC EDGAR"
  externalId: string; // e.g. "LEI: 5493006MHB84DD0ZWV18" or "QID: Q315312"
  verifiedName: string;
  disambiguationStatus: DisambiguationStatus;
  disambiguationScore: number; // 0 - 100
  registryUrl: string;
  registeredJurisdiction: string;
  incorporationOrBirthDate?: string;
  entityStatus: string; // e.g. "Active", "Dissolved", "Sanctioned Entity", "Convicted / Incarcerated", "In Public Office"
  identifiers: EntityIdentifier[];
  verifiedRolesOrDirectorships: DirectorshipOrRole[];
  disambiguationNotes: string;
  candidateHomonyms: CandidateHomonym[];
  lastRegistrySync: string;
}

// -------------------------------------------------------------
// Real-Time News Feed Monitoring & Alert Types
// -------------------------------------------------------------
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type AlertType = 
  | 'BREAKING_ADVERSE_NEWS' 
  | 'SANCTION_UPDATE' 
  | 'REGULATORY_ENFORCEMENT' 
  | 'NEGATIVE_SENTIMENT_SPIKE' 
  | 'CORPORATE_REGISTRY_CHANGE';

export interface MonitoringAlert {
  id: string;
  subjectId: string;
  subjectName: string;
  reportId?: string;
  timestamp: string;
  severity: AlertSeverity;
  alertType: AlertType;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  deltaRiskScore: number; // e.g. +18
  sentimentScore: number; // -100 to +100
  detectedKeywords: string[];
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionNote?: string;
}

export interface NewsStreamItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  subjectMentioned: string;
  subjectId: string;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  riskCategory?: string;
  triggersAlert: boolean;
}

export interface MonitoredSubject {
  id: string;
  subjectName: string;
  subjectType: SubjectType;
  jurisdiction: string;
  reportId: string;
  initialRiskScore: number;
  currentRiskScore: number;
  riskLevel: RiskLevel;
  monitoringStatus: 'ACTIVE' | 'PAUSED' | 'ALERT_TRIGGERED';
  monitoringSince: string;
  lastScannedAt: string;
  scanIntervalSeconds: number;
  sourcesMonitored: string[];
  alertCount: number;
  linkedRegistryId?: string;
  recentHeadlinesScanned: {
    title: string;
    source: string;
    publishedAt: string;
    sentimentScore: number;
    hasRiskTrigger: boolean;
  }[];
}
