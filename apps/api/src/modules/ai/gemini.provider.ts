import { Injectable, Logger } from '@nestjs/common';
import { StructuredAiOutput, StructuredAiOutputSchema } from '@impactlens/shared';
import { ILlmProvider } from './llm-provider.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  public readonly name = 'GeminiProvider';
  private readonly logger = new Logger(GeminiProvider.name);

  async generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }

    const model = process.env.LLM_MODEL || 'gemini-1.5-flash';
    const timeout = Number(process.env.LLM_TIMEOUT_MS) || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nProvide the response strictly as valid JSON.` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = JSON.parse(rawText);
      return StructuredAiOutputSchema.parse(parsed);
    } finally {
      clearTimeout(timer);
    }
  }
}
