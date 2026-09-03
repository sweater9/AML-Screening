export interface NvidiaNimConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface NvidiaChatOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
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
            'You are an AML/CFT decision-support analyst. Never invent sanctions, PEP, regulatory, registry, court, or adverse-media facts. Treat supplied evidence as the only factual evidence. If evidence is insufficient, say so explicitly and require manual verification.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 8192,
      stream: false,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
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

export async function checkNvidiaNim(): Promise<{
  configured: boolean;
  reachable: boolean;
  model?: string;
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
    return { configured: true, reachable: true, model: config.model };
  } catch (error: any) {
    return {
      configured: true,
      reachable: false,
      model: config.model,
      error: error?.message || 'Unable to reach NVIDIA API',
    };
  }
}
