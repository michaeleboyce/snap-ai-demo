import OpenAI from 'openai';

let openai: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (openai) return openai;
  if (typeof window !== 'undefined') {
    throw new Error('OpenAI client should only be instantiated on the server');
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing');
  }
  openai = new OpenAI({ apiKey });
  return openai;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatWithFallbackParams {
  messages: ChatMessage[];
  model?: string; // preferred model
  fallbackModel?: string;
  temperature?: number;
  maxCompletionTokens?: number;
  responseFormat?: { type: 'json_object' } | undefined;
}

export async function chatWithFallback({
  messages,
  model = 'gpt-4-turbo-preview',
  fallbackModel = 'gpt-4',
  temperature,
  maxCompletionTokens,
  responseFormat,
}: ChatWithFallbackParams): Promise<{ content: string; modelUsed: string }> {
  const primaryAllowsTemperature = true; // Both gpt-4 models support temperature
  const fallbackAllowsTemperature = true;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages,
      ...(temperature !== undefined && primaryAllowsTemperature ? { temperature } : {}),
      ...(maxCompletionTokens !== undefined ? { max_completion_tokens: maxCompletionTokens } : {}),
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });
    return {
      content: completion.choices[0].message.content ?? '',
      modelUsed: completion.model,
    };
  } catch {
    const completion = await getOpenAI().chat.completions.create({
      model: fallbackModel,
      messages,
      ...(temperature !== undefined && fallbackAllowsTemperature ? { temperature } : {}),
      ...(maxCompletionTokens !== undefined ? { max_completion_tokens: maxCompletionTokens } : {}),
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });
    return {
      content: completion.choices[0].message.content ?? '',
      modelUsed: completion.model,
    };
  }
}


