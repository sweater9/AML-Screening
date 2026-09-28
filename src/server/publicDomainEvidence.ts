import type { ScreeningRequest } from '../types';
import type { ScreeningEvidenceItem } from './nvidiaScreening';

const USER_AGENT = 'VeritasScreen/1.0 compliance-screening (public-domain-osint)';

const WIKIDATA_SEARCH_URL = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_ENTITY_URL = 'https://www.wikidata.org/w/api.php';
const GDELT_DOC_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const SEC_EDGAR_COMPANY_URL = 'https://www.sec.gov/cgi-bin/browse-edgar';
const OPENCORPORATES_SEARCH_URL = 'https://api.opencorporates.com/v0.4/companies/search';
const OPENCORPORATES_OFFICERS_URL = 'https://api.opencorporates.com/v0.4/officers/search';

const REGULATORY_KEYWORDS = ['fine', 'penalty', 'settlement', 'enforcement', 'indictment', 'indicted', 'fraud', 'money laundering', 'bribery', 'corruption', 'sanction', 'debarred', 'suspended', 'lawsuit', 'charged', 'guilty', 'conviction', 'seizure', 'forfeiture'];

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function primaryTerm(subject: ScreeningRequest): string {
  return subject.name.trim();
}

// -------------------------------------------------------------
// Wikidata public-figure knowledge graph: political positions
// held (PEP signal) and registry/identifier data for individuals
// and entities alike. No API key required.
// -------------------------------------------------------------
async function collectWikidataEvidence(subject: ScreeningRequest): Promise<ScreeningEvidenceItem[]> {
  const term = primaryTerm(subject);
  if (term.length < 3) return [];
  const searchUrl = `${WIKIDATA_SEARCH_URL}?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&limit=3&type=item`;
  const search = await fetchJson<{ search?: Array<{ id: string; label: string; description?: string; concepturi: string }> }>(searchUrl);
  const candidates = Array.isArray(search.search) ? search.search : [];
  if (!candidates.length) {
    return [{
      id: 'wikidata-registry',
      sourceType: 'REGISTRY',
      sourceName: 'Wikidata Public Figure & Entity Knowledge Graph',
      sourceUrl: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(term)}`,
      retrievedAt: new Date().toISOString(),
      text: `No Wikidata entity matched the supplied subject name "${term}". This does not establish that the subject holds no public role; it only reflects an absence of a Wikidata record.`,
    }];
  }

  const items: ScreeningEvidenceItem[] = [];
  for (const candidate of candidates.slice(0, 2)) {
    const entityUrl = `${WIKIDATA_ENTITY_URL}?action=wbgetentities&ids=${candidate.id}&props=claims|labels|descriptions&languages=en&format=json`;
    try {
      const entity = await fetchJson<any>(entityUrl);
      const claims = entity?.entities?.[candidate.id]?.claims ?? {};
      const positions: string[] = Array.isArray(claims.P39) ? claims.P39.map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean) : [];
      const citizenship: string[] = Array.isArray(claims.P27) ? claims.P27.map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean) : [];
      const retrievedAt = new Date().toISOString();
      const summary = `Wikidata entity ${candidate.id} ("${candidate.label}"${candidate.description ? `, ${candidate.description}` : ''}) matched the supplied subject name. ` +
        (positions.length ? `Recorded "position held" (P39) claims: ${positions.join(', ')} (resolve Wikidata IDs for role titles). ` : 'No "position held" (P39) claims are recorded on this entity. ') +
        (citizenship.length ? `Recorded citizenship/jurisdiction claims (P27): ${citizenship.join(', ')}. ` : '') +
        'This is a candidate identity match only; confirm against the subject\'s date of birth/incorporation and jurisdiction before relying on it for PEP or entity-identity conclusions.';
      items.push({
        id: `wikidata-${candidate.id}`,
        sourceType: positions.length ? 'PEP' : 'REGISTRY',
        sourceName: 'Wikidata Public Figure & Entity Knowledge Graph',
        sourceUrl: candidate.concepturi || `https://www.wikidata.org/wiki/${candidate.id}`,
        retrievedAt,
        text: summary,
      });
    } catch {
      // A single candidate failing to resolve should not drop the whole source; continue with others.
    }
  }
  return items;
}

// -------------------------------------------------------------
// GDELT Global Knowledge Graph: open, real-time global news
// index. Used for adverse-media discovery and, via keyword
// filtering, regulatory/enforcement-flavoured coverage. No key.
// -------------------------------------------------------------
async function collectGdeltEvidence(subject: ScreeningRequest): Promise<ScreeningEvidenceItem[]> {
  const term = primaryTerm(subject);
  if (term.length < 3) return [];
  const query = `"${term}"`;
  const url = `${GDELT_DOC_URL}?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=40&format=json&sort=hybridrel&timespan=5years`;
  const payload = await fetchJson<{ articles?: Array<{ title?: string; url?: string; seendate?: string; domain?: string; sourcecountry?: string; tone?: number }> }>(url);
  const articles = Array.isArray(payload.articles) ? payload.articles : [];
  const retrievedAt = new Date().toISOString();
  if (!articles.length) {
    return [{
      id: 'gdelt-adverse-media',
      sourceType: 'ADVERSE_MEDIA',
      sourceName: 'GDELT Global Open News Index',
      sourceUrl: `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist`,
      retrievedAt,
      text: `A global open-news search for "${term}" over the trailing five years returned no indexed articles. This reflects index coverage only and does not establish a clean media record.`,
    }];
  }

  const regulatoryHits = articles.filter(a => REGULATORY_KEYWORDS.some(k => (a.title || '').toLowerCase().includes(k)));
  const generalHits = articles.filter(a => !regulatoryHits.includes(a));

  const items: ScreeningEvidenceItem[] = [];
  if (generalHits.length) {
    const lines = generalHits.slice(0, 25).map(a => `- "${a.title || 'Untitled'}" | ${a.domain || 'unknown source'} | ${a.seendate || 'undated'} | ${a.url || ''}`).join('\n');
    items.push({
      id: 'gdelt-adverse-media',
      sourceType: 'ADVERSE_MEDIA',
      sourceName: 'GDELT Global Open News Index',
      sourceUrl: `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist`,
      retrievedAt,
      text: `Global open-news search for "${term}" (trailing 5 years, top relevance-ranked results). Each line is a candidate article requiring editorial review for relevance and identity match:\n${lines}`,
    });
  }
  if (regulatoryHits.length) {
    const lines = regulatoryHits.slice(0, 25).map(a => `- "${a.title || 'Untitled'}" | ${a.domain || 'unknown source'} | ${a.seendate || 'undated'} | ${a.url || ''}`).join('\n');
    items.push({
      id: 'gdelt-regulatory-signal',
      sourceType: 'REGULATORY',
      sourceName: 'GDELT Global Open News Index (enforcement-keyword filtered)',
      sourceUrl: `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist`,
      retrievedAt,
      text: `News headlines matching enforcement/legal-risk keywords (${REGULATORY_KEYWORDS.join(', ')}) for "${term}". These are candidate signals from open media, not confirmed regulator filings, and require verification against the named authority's own register:\n${lines}`,
    });
  }
  return items;
}

// -------------------------------------------------------------
// SEC EDGAR company search: US public-company registry lookup.
// No key required; SEC requires an identifying User-Agent.
// -------------------------------------------------------------
async function collectSecEdgarEvidence(subject: ScreeningRequest): Promise<ScreeningEvidenceItem[]> {
  const term = primaryTerm(subject);
  if (term.length < 3) return [];
  const url = `${SEC_EDGAR_COMPANY_URL}?action=getcompany&company=${encodeURIComponent(term)}&type=&dateb=&owner=include&count=20&output=atom`;
  const xml = await fetchText(url);
  const retrievedAt = new Date().toISOString();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  if (!entries.length) {
    return [{
      id: 'sec-edgar-registry',
      sourceType: 'REGISTRY',
      sourceName: 'US SEC EDGAR Company Registry',
      sourceUrl: url,
      retrievedAt,
      text: `SEC EDGAR company search for "${term}" returned no registered US public-company filer records. This does not establish that the subject has no US regulatory footprint outside SEC-registered filers.`,
    }];
  }
  const titles = entries.slice(0, 15).map(entry => {
    const title = /<title>([^<]*)<\/title>/.exec(entry)?.[1] || 'Unknown filer';
    const link = /<link[^>]*href="([^"]*)"/.exec(entry)?.[1] || '';
    return `- ${title} | ${link}`;
  }).join('\n');
  return [{
    id: 'sec-edgar-registry',
    sourceType: 'REGISTRY',
    sourceName: 'US SEC EDGAR Company Registry',
    sourceUrl: url,
    retrievedAt,
    text: `SEC EDGAR company search for "${term}" returned the following candidate US public-company filer records. Identity match to the subject must be confirmed before use:\n${titles}`,
  }];
}

// -------------------------------------------------------------
// OpenCorporates: global open company-registry aggregator, and
// its officers/directors index. No key required for light use.
// -------------------------------------------------------------
async function collectOpenCorporatesEvidence(subject: ScreeningRequest): Promise<ScreeningEvidenceItem[]> {
  const term = primaryTerm(subject);
  if (term.length < 3) return [];
  const retrievedAt = new Date().toISOString();
  const items: ScreeningEvidenceItem[] = [];

  if (subject.subjectType === 'entity') {
    const url = `${OPENCORPORATES_SEARCH_URL}?q=${encodeURIComponent(term)}&per_page=15`;
    const payload = await fetchJson<{ results?: { companies?: Array<{ company: any }> } }>(url);
    const companies = payload.results?.companies || [];
    const lines = companies.slice(0, 15).map(({ company }) => `- ${company?.name || 'Unknown'} | ${company?.jurisdiction_code || 'unknown jurisdiction'} | status: ${company?.current_status || 'unknown'} | ${company?.opencorporates_url || ''}`).join('\n');
    items.push({
      id: 'opencorporates-registry',
      sourceType: 'REGISTRY',
      sourceName: 'OpenCorporates Global Business Registry',
      sourceUrl: url,
      retrievedAt,
      text: companies.length
        ? `OpenCorporates registry search for "${term}" returned the following candidate legal-entity records across global company registers. Identity match must be confirmed:\n${lines}`
        : `OpenCorporates registry search for "${term}" returned no candidate legal-entity records.`,
    });
  } else {
    const url = `${OPENCORPORATES_OFFICERS_URL}?q=${encodeURIComponent(term)}&per_page=15`;
    const payload = await fetchJson<{ results?: { officers?: Array<{ officer: any }> } }>(url);
    const officers = payload.results?.officers || [];
    const lines = officers.slice(0, 15).map(({ officer }) => `- ${officer?.name || 'Unknown'} | role: ${officer?.position || 'unspecified'} | company: ${officer?.company?.name || 'unknown'} (${officer?.company?.jurisdiction_code || 'unknown jurisdiction'}) | ${officer?.opencorporates_url || ''}`).join('\n');
    items.push({
      id: 'opencorporates-officers',
      sourceType: 'REGISTRY',
      sourceName: 'OpenCorporates Global Officers & Directorships Index',
      sourceUrl: url,
      retrievedAt,
      text: officers.length
        ? `OpenCorporates officer/director search for "${term}" returned the following candidate directorship/role records across global company registers. Identity match must be confirmed:\n${lines}`
        : `OpenCorporates officer/director search for "${term}" returned no candidate directorship records.`,
    });
  }
  return items;
}

export interface PublicDomainEvidenceResult {
  evidence: ScreeningEvidenceItem[];
  sourceErrors: string[];
}

export async function collectPublicDomainEvidence(subject: ScreeningRequest): Promise<PublicDomainEvidenceResult> {
  const collectors: Array<[string, () => Promise<ScreeningEvidenceItem[]>]> = [
    ['Wikidata Public Figure & Entity Knowledge Graph', () => collectWikidataEvidence(subject)],
    ['GDELT Global Open News Index', () => collectGdeltEvidence(subject)],
    ['US SEC EDGAR Company Registry', () => collectSecEdgarEvidence(subject)],
    ['OpenCorporates Global Business Registry', () => collectOpenCorporatesEvidence(subject)],
  ];
  const settled = await Promise.allSettled(collectors.map(([, run]) => run()));
  const evidence: ScreeningEvidenceItem[] = [];
  const sourceErrors: string[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') evidence.push(...result.value);
    else sourceErrors.push(`${collectors[index][0]} unavailable: ${result.reason instanceof Error ? result.reason.message : 'retrieval failed'}`);
  });
  return { evidence, sourceErrors };
}
