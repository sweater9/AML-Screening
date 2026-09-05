import express from 'express';
import dotenv from 'dotenv';
import type { ScreeningRequest } from '../types';
import { analyzeWithNvidia, type ScreeningEvidenceItem } from './nvidiaScreening';
import { checkNvidiaNim } from './nvidiaNim';
import { collectOfficialSanctionsEvidence } from './officialEvidence';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://sweater9.github.io').split(',').map(value => value.trim()).filter(Boolean);

function isEvidenceItem(value: unknown): value is ScreeningEvidenceItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && !!item.id.trim() && typeof item.sourceType === 'string' && typeof item.sourceName === 'string' && !!item.sourceName.trim() && typeof item.retrievedAt === 'string' && !!item.retrievedAt.trim() && typeof item.text === 'string' && !!item.text.trim();
}

function applyCors(req: express.Request, res: express.Response, next: express.NextFunction) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

export function createEvidenceServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(applyCors);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (_req, res) => {
    const nvidia = await checkNvidiaNim();
    res.status(nvidia.configured && nvidia.reachable ? 200 : 503).json({ status: nvidia.configured && nvidia.reachable ? 'ok' : 'degraded', timestamp: new Date().toISOString(), screeningEngine: 'NVIDIA_NIM_EVIDENCE_BOUND', officialSources: ['US Treasury OFAC SDN List', 'UK Sanctions List'], nvidia: { configured: nvidia.configured, reachable: nvidia.reachable, model: nvidia.model, error: nvidia.error } });
  });

  app.post('/api/screen', async (req, res) => {
    try {
      const subject = req.body?.subject as ScreeningRequest | undefined;
      const rawEvidence = req.body?.evidence;
      if (!subject?.name?.trim()) return res.status(400).json({ error: 'Subject name is required.' });
      if (rawEvidence !== undefined && !Array.isArray(rawEvidence)) return res.status(400).json({ error: 'Evidence must be an array.' });

      const suppliedEvidence = (Array.isArray(rawEvidence) ? rawEvidence : []).filter(isEvidenceItem);
      const official = await collectOfficialSanctionsEvidence(subject);
      const evidence = [...official.evidence, ...suppliedEvidence];
      const analysis = await analyzeWithNvidia(subject, evidence);
      analysis.verificationGaps = Array.from(new Set([...analysis.verificationGaps, ...official.sourceErrors]));

      return res.json({ reportId: `VER-${Date.now().toString(36).toUpperCase()}`, generatedAt: new Date().toISOString(), investigator: 'VeritasScreen NVIDIA NIM Evidence Analysis', subject, evidenceCount: evidence.length, officialSourceCount: official.evidence.length, sourceErrors: official.sourceErrors, ...analysis });
    } catch (error: any) {
      console.error('[screening]', error);
      return res.status(502).json({ error: 'Screening analysis could not be completed.', evidenceStatus: 'INSUFFICIENT_REQUIRES_VERIFICATION', manualVerificationRequired: true });
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  return app;
}

if (process.env.NODE_ENV !== 'test') createEvidenceServer().listen(PORT, '0.0.0.0', () => console.log(`VeritasScreen evidence API listening on port ${PORT}`));
