import { Injectable, Logger } from '@nestjs/common';
import { StructuredAiOutput, StructuredAiOutputSchema } from '@impactlens/shared';
import { ILlmProvider } from './llm-provider.interface';

@Injectable()
export class OpenAiProvider implements ILlmProvider {
  public readonly name = 'OpenAiProvider';
  private readonly logger = new Logger(OpenAiProvider.name);

  async generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables.');
    }

    const model = process.env.LLM_MODEL || 'gpt-4o';
    const timeout = Number(process.env.LLM_TIMEOUT_MS) || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return StructuredAiOutputSchema.parse(parsed);
    } finally {
      clearTimeout(timer);
    }
  }
}
