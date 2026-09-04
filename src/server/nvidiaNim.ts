export interface NvidiaNimConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface NvidiaChatOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  jsonSchema?: Record<string, unknown>;
}

export function getNvidiaNimConfig(): NvidiaNimConfig | null {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, ''),
    model: process.env.NVIDIA_NIM_MODEL?.trim() || 'nvidia/nemotron-3.5-lightning-30b-a3b',
  };
}

export async function nvidiaChat(
  prompt: string,
  options: NvidiaChatOptions = {},
): Promise<string> {
  const config = getNvidiaNimConfig();
  if (!config) throw new Error('NVIDIA_API_KEY is not configured');

  const structuredOutput = options.jsonSchema
    ? { guided_json: options.jsonSchema }
    : options.json
      ? { response_format: { type: 'json_object' } }
      : {};

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an AML/CFT decision-support analyst. Never invent sanctions, PEP, regulatory, registry, court, or adverse-media facts. Treat supplied evidence as the only factual evidence. Absence of supplied evidence is not evidence of a clean result. If evidence is insufficient, explicitly require manual verification. Never claim that an official sanctions list, PEP register, court record, regulator, registry, or news source was checked unless that evidence is supplied in the request.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature ?? 0,
      max_tokens: options.maxTokens ?? 8192,
      stream: false,
      ...(options.json || options.jsonSchema
        ? { chat_template_kwargs: { enable_thinking: false } }
        : {}),
      ...structuredOutput,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`NVIDIA NIM request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const payload = (await response.json()) as any;
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('NVIDIA NIM returned an empty completion');
  }
  return content;
}

function parseNvidiaJson<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error('NVIDIA NIM returned invalid JSON');
  }
}

export async function nvidiaJson<T = unknown>(prompt: string, maxTokens = 8192): Promise<T> {
  const raw = await nvidiaChat(prompt, { json: true, temperature: 0, maxTokens });
  return parseNvidiaJson<T>(raw);
}

export async function nvidiaStructuredJson<T = unknown>(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  maxTokens = 8192,
): Promise<T> {
  const raw = await nvidiaChat(prompt, {
    jsonSchema,
    temperature: 0,
    maxTokens,
  });
  return parseNvidiaJson<T>(raw);
}

export async function checkNvidiaNim(): Promise<{
  configured: boolean;
  reachable: boolean;
  model?: string;
  availableModels?: string[];
  error?: string;
}> {
  const config = getNvidiaNimConfig();
  if (!config) return { configured: false, reachable: false };

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!response.ok) {
      return {
        configured: true,
        reachable: false,
        model: config.model,
        error: `NVIDIA API returned HTTP ${response.status}`,
      };
    }
    const payload = (await response.json()) as any;
    const availableModels = Array.isArray(payload?.data)
      ? payload.data.map((entry: any) => entry?.id).filter((id: unknown): id is string => typeof id === 'string')
      : [];
    return { configured: true, reachable: true, model: config.model, availableModels };
  } catch (error: any) {
    return {
      configured: true,
      reachable: false,
      model: config.model,
      error: error?.message || 'Unable to reach NVIDIA API',
    };
  }
}
