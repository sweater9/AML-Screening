import type { ScreeningRequest } from '../types';
import type { ScreeningEvidenceItem } from './nvidiaScreening';

const UK_SANCTIONS_CSV = 'https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv';
const UK_SANCTIONS_PAGE = 'https://www.gov.uk/government/publications/the-uk-sanctions-list';
const OFAC_SDN_CSV = 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV';
const OFAC_SLS_PAGE = 'https://ofac.treasury.gov/sanctions-list-service';

function normalize(value: string): string {
  return value.toLocaleLowerCase('en').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function searchTerms(subject: ScreeningRequest): string[] {
  const raw = [subject.name, ...(Array.isArray((subject as any).aliases) ? (subject as any).aliases : [])]
    .filter((value): value is string => typeof value === 'string' && value.trim().length >= 3);
  return Array.from(new Set(raw.map(normalize).filter(Boolean)));
}

function csvLinesContaining(csv: string, terms: string[], limit = 25): string[] {
  if (!terms.length) return [];
  const matches: string[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const normalized = normalize(line);
    if (terms.some(term => normalized.includes(term))) {
      matches.push(line.slice(0, 6000));
      if (matches.length >= limit) break;
    }
  }
  return matches;
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
  const csv = await fetchText(dataUrl);
  const matches = csvLinesContaining(csv, terms);
  return {
    id,
    sourceType: 'SANCTIONS',
    sourceName,
    sourceUrl,
    retrievedAt,
    text: matches.length
      ? `Authoritative list retrieval completed at ${retrievedAt}. Potential text matches for the supplied subject terms follow. These are candidates only and require identity resolution.\n${matches.join('\n')}`
      : `Authoritative list retrieval completed at ${retrievedAt}. No text candidate containing the supplied normalized subject name or aliases was found in the retrieved dataset. This is a name-search result only and does not establish that the subject is clear.`,
  };
}

export interface OfficialEvidenceResult {
  evidence: ScreeningEvidenceItem[];
  sourceErrors: string[];
}

export async function collectOfficialSanctionsEvidence(subject: ScreeningRequest): Promise<OfficialEvidenceResult> {
  const terms = searchTerms(subject);
  const sources = [
    ['ofac-sdn', 'US Treasury OFAC SDN List', OFAC_SDN_CSV, OFAC_SLS_PAGE],
    ['uk-sanctions', 'UK Foreign, Commonwealth & Development Office Sanctions List', UK_SANCTIONS_CSV, UK_SANCTIONS_PAGE],
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
