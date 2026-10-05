import { Injectable, Logger } from '@nestjs/common';
import { StructuredAiOutput, StructuredAiOutputSchema } from '@impactlens/shared';
import { ILlmProvider } from './llm-provider.interface';

@Injectable()
export class AnthropicProvider implements ILlmProvider {
  public readonly name = 'AnthropicProvider';
  private readonly logger = new Logger(AnthropicProvider.name);

  async generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured in environment variables.');
    }

    const model = process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022';
    const timeout = Number(process.env.LLM_TIMEOUT_MS) || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: Number(process.env.MAX_TOKENS) || 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `${userPrompt}\n\nOutput only valid JSON.` }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errText}`);
      }

      const data: any = await response.json();
      const content = data.content?.[0]?.text;
      if (!content) {
        throw new Error('Empty response from Anthropic API');
      }

      // Extract JSON if wrapped in markdown blocks
      const cleanJson = content.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const parsed = JSON.parse(cleanJson);
      return StructuredAiOutputSchema.parse(parsed);
    } finally {
      clearTimeout(timer);
    }
  }
}
