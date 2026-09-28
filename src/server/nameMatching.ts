// -------------------------------------------------------------
// Name-matching engine
//
// Purpose: score candidate watchlist/registry text against a
// subject's supplied name and aliases, the way commercial
// screening engines (e.g. LexisNexis Bridger Insight XG) run a
// dedicated matching layer ahead of analyst/LLM review so that
// low-probability noise is scored and ranked rather than handed
// over as an undifferentiated wall of substring hits. This module
// never fabricates facts; it only scores text that was already
// retrieved from an official source.
// -------------------------------------------------------------

export type MatchType = 'EXACT' | 'FUZZY_HIGH' | 'PARTIAL' | 'FALSE_POSITIVE';

export interface NameMatchScore {
  score: number; // 0 - 100
  matchType: MatchType;
  matchedTerm: string;
  matchedWindow: string;
}

export function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeName(value).split(' ').filter(Boolean);
}

// Standard Jaro-Winkler string similarity, 0-1.
function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const aLen = a.length;
  const bLen = b.length;
  if (!aLen || !bLen) return 0;

  const matchDistance = Math.max(0, Math.floor(Math.max(aLen, bLen) / 2) - 1);
  const aMatches = new Array(aLen).fill(false);
  const bMatches = new Array(bLen).fill(false);

  let matches = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  const jaro = (matches / aLen + matches / bLen + (matches - transpositions) / matches) / 3;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, aLen, bLen); i++) {
    if (a[i] !== b[i]) break;
    prefix++;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

// Recall of the search term's tokens within a candidate window, order-independent
// (handles "Ivanov, Petr" record order vs a "Petr Ivanov" search term) and tolerant
// of extra tokens inside the window (record IDs, titles, a middle name).
function tokenRecall(termTokens: string[], windowTokens: string[]): number {
  if (!termTokens.length) return 0;
  const windowSet = new Set(windowTokens);
  let hit = 0;
  for (const token of new Set(termTokens)) if (windowSet.has(token)) hit++;
  return hit / new Set(termTokens).size;
}

// Best-effort: slide a window across the candidate text's tokens, sized to the
// search term plus a small allowance for interleaved extra tokens (IDs, list
// codes, titles, a middle name), and keep the highest-scoring window. This
// lets us score a short name against a long, noisy line (a raw CSV/XML
// record) without needing a bespoke column parser per source format.
function bestWindowScore(candidateTokens: string[], termTokens: string[]): { score: number; window: string } {
  if (!candidateTokens.length || !termTokens.length) return { score: 0, window: '' };
  const termJoined = termTokens.join(' ');
  let best = { score: 0, window: '' };

  for (const windowSize of [termTokens.length, termTokens.length + 1, termTokens.length + 2]) {
    if (windowSize > candidateTokens.length) continue;
    for (let start = 0; start <= candidateTokens.length - windowSize; start++) {
      const window = candidateTokens.slice(start, start + windowSize);
      const recall = tokenRecall(termTokens, window);
      if (recall === 0) continue;
      const jw = jaroWinkler(termJoined, window.join(' '));
      const combined = recall * 0.7 + jw * 0.3;
      if (combined > best.score) best = { score: combined, window: window.join(' ') };
    }
  }

  return best;
}

function classify(score: number): MatchType {
  if (score >= 0.97) return 'EXACT';
  if (score >= 0.85) return 'FUZZY_HIGH';
  if (score >= 0.65) return 'PARTIAL';
  return 'FALSE_POSITIVE';
}

// Score a single candidate text (e.g. one watchlist record line) against a
// list of subject search terms (name + aliases) and return the best match.
export function scoreCandidate(candidateText: string, terms: string[]): NameMatchScore {
  const candidateTokens = tokenize(candidateText);
  let best: NameMatchScore = { score: 0, matchType: 'FALSE_POSITIVE', matchedTerm: '', matchedWindow: '' };
  for (const term of terms) {
    const termTokens = tokenize(term);
    if (!termTokens.length) continue;
    const { score, window } = bestWindowScore(candidateTokens, termTokens);
    const pct = Math.round(score * 100);
    if (pct > best.score) best = { score: pct, matchType: classify(score), matchedTerm: term, matchedWindow: window };
  }
  return best;
}

export interface ScoredCandidate<T> {
  item: T;
  match: NameMatchScore;
}

// Score and rank a set of candidate records, dropping anything the matching
// engine classifies as a false positive. This mirrors the "advanced matching
// modules reduce false positives / categorize high-probability matches for
// prioritization" behaviour of commercial watchlist-screening engines.
export function rankCandidates<T>(candidates: T[], terms: string[], textOf: (item: T) => string, minMatchType: MatchType = 'PARTIAL'): ScoredCandidate<T>[] {
  const order: Record<MatchType, number> = { FALSE_POSITIVE: 0, PARTIAL: 1, FUZZY_HIGH: 2, EXACT: 3 };
  const minRank = order[minMatchType];
  return candidates
    .map(item => ({ item, match: scoreCandidate(textOf(item), terms) }))
    .filter(scored => order[scored.match.matchType] >= minRank)
    .sort((a, b) => b.match.score - a.match.score);
}
