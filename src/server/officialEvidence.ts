import type { ScreeningRequest } from '../types';
import type { ScreeningEvidenceItem } from './nvidiaScreening';
import { normalizeName, rankCandidates } from './nameMatching';

const UK_SANCTIONS_CSV = 'https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv';
const UK_SANCTIONS_PAGE = 'https://www.gov.uk/government/publications/the-uk-sanctions-list';
const OFAC_SDN_CSV = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV';
const OFAC_SLS_PAGE = 'https://ofac.treasury.gov/sanctions-list-service';
const OFAC_NONSDN_CSV = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV';
const OFAC_NONSDN_PAGE = 'https://ofac.treasury.gov/consolidated-sanctions-list-non-sdn-lists';
const UN_CONSOLIDATED_XML = 'https://main.un.org/securitycouncil/sites/default/files/2026-08/consolidated.xml';
const UN_CONSOLIDATED_PAGE = 'https://main.un.org/securitycouncil/content/un-sc-consolidated-list';
const EU_SANCTIONS_CSV = 'https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList/content?token=dG9rZW4tMjAxNw';
const EU_SANCTIONS_PAGE = 'https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions';

function searchTerms(subject: ScreeningRequest): string[] {
  const raw = [subject.name, ...(Array.isArray((subject as any).aliases) ? (subject as any).aliases : [])]
    .filter((value): value is string => typeof value === 'string' && value.trim().length >= 3);
  return Array.from(new Set(raw.map(value => value.trim()).filter(Boolean)));
}

// Matching pipeline (mirrors a commercial watchlist-screening engine):
// 1. Coarse pre-filter, to avoid scoring every line of a multi-megabyte list,
//    keeping any line that shares at least one significant name token with a
//    search term.
// 2. Score every surviving candidate with the fuzzy/token name-matching
//    engine and rank by confidence.
// 3. Drop anything the engine classifies as a false positive so downstream
//    analysis is prioritized by match quality instead of raw substring noise.
function candidateLines(text: string, terms: string[], limit = 25): { line: string; score: number; matchType: string; matchedTerm: string }[] {
  if (!terms.length) return [];
  const termTokens = new Set(terms.flatMap(term => normalizeName(term).split(' ').filter(token => token.length >= 3)));
  if (!termTokens.size) return [];

  const preFiltered: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const normalized = normalizeName(line);
    if ([...termTokens].some(token => normalized.includes(token))) {
      preFiltered.push(line.slice(0, 6000));
      if (preFiltered.length >= limit * 8) break; // bound work on very large lists
    }
  }

  return rankCandidates(preFiltered, terms, line => line, 'PARTIAL')
    .slice(0, limit)
    .map(({ item, match }) => ({ line: item, score: match.score, matchType: match.matchType, matchedTerm: match.matchedTerm }));
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'VeritasScreen/1.0 compliance-screening' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function listEvidence(id: string, sourceName: string, dataUrl: string, sourceUrl: string, terms: string[]): Promise<ScreeningEvidenceItem> {
  const retrievedAt = new Date().toISOString();
  const data = await fetchText(dataUrl);
  const matches = candidateLines(data, terms);
  const lines = matches.map(m => `[MATCH ${m.score}% ${m.matchType} vs "${m.matchedTerm}"] ${m.line}`);
  return {
    id,
    sourceType: 'SANCTIONS',
    sourceName,
    sourceUrl,
    retrievedAt,
    text: lines.length
      ? `Authoritative list retrieval completed at ${retrievedAt}. Candidates were scored by a fuzzy name-matching engine (token-overlap + Jaro-Winkler similarity) against the supplied subject name and aliases, ranked by confidence, and low-probability text matches were discarded as false positives. Remaining candidates require identity resolution before any compliance conclusion is drawn:\n${lines.join('\n')}`
      : `Authoritative list retrieval completed at ${retrievedAt}. The fuzzy name-matching engine found no candidate record in the retrieved dataset scoring above the false-positive threshold for the supplied subject name or aliases. This is a name-search result only and does not establish that the subject is clear.`,
  };
}

export interface OfficialEvidenceResult {
  evidence: ScreeningEvidenceItem[];
  sourceErrors: string[];
}

export async function collectOfficialSanctionsEvidence(subject: ScreeningRequest): Promise<OfficialEvidenceResult> {
  const terms = searchTerms(subject);
  const sources = [
    ['ofac-sdn', 'US Treasury OFAC Specially Designated Nationals (SDN) List', OFAC_SDN_CSV, OFAC_SLS_PAGE],
    ['ofac-nonsdn', 'US Treasury OFAC Consolidated Non-SDN Sanctions Lists', OFAC_NONSDN_CSV, OFAC_NONSDN_PAGE],
    ['uk-sanctions', 'UK Foreign, Commonwealth & Development Office Sanctions List', UK_SANCTIONS_CSV, UK_SANCTIONS_PAGE],
    ['un-consolidated', 'United Nations Security Council Consolidated Sanctions List', UN_CONSOLIDATED_XML, UN_CONSOLIDATED_PAGE],
    ['eu-consolidated', 'European Union Consolidated Financial Sanctions List', EU_SANCTIONS_CSV, EU_SANCTIONS_PAGE],
  ] as const;
  const settled = await Promise.allSettled(sources.map(([id, name, dataUrl, sourceUrl]) => listEvidence(id, name, dataUrl, sourceUrl, terms)));
  const evidence: ScreeningEvidenceItem[] = [];
  const sourceErrors: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') evidence.push(result.value);
    else sourceErrors.push(`${sources[index][1]} unavailable: ${result.reason instanceof Error ? result.reason.message : 'retrieval failed'}`);
  });
  return { evidence, sourceErrors };
}
