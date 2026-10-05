import { Injectable, Logger, Optional } from '@nestjs/common';
import { ILlmProvider } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { AnthropicProvider } from './anthropic.provider';
import { StructuredAiOutput } from '@impactlens/shared';

@Injectable()
export class AiService implements ILlmProvider {
  private readonly logger = new Logger(AiService.name);
  private activeProvider: ILlmProvider;
  private fallbackMock: MockLlmProvider;

  constructor(
    @Optional() private mockProvider?: MockLlmProvider,
    @Optional() private openaiProvider?: OpenAiProvider,
    @Optional() private geminiProvider?: GeminiProvider,
    @Optional() private anthropicProvider?: AnthropicProvider
  ) {
    this.fallbackMock = this.mockProvider || new MockLlmProvider();
    const configuredProvider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

    if (configuredProvider === 'openai' && process.env.OPENAI_API_KEY && this.openaiProvider) {
      this.activeProvider = this.openaiProvider;
    } else if (configuredProvider === 'gemini' && process.env.GEMINI_API_KEY && this.geminiProvider) {
      this.activeProvider = this.geminiProvider;
    } else if (configuredProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY && this.anthropicProvider) {
      this.activeProvider = this.anthropicProvider;
    } else {
      this.activeProvider = this.fallbackMock;
    }

    this.logger.log(`Active AI Provider selected: ${this.activeProvider.name}`);
  }

  get name(): string {
    return this.activeProvider?.name || 'MockLlmProvider';
  }

  async generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput> {
    try {
      return await this.activeProvider.generateStructuredOutput(systemPrompt, userPrompt, allowedEvidenceIds);
    } catch (err: any) {
      this.logger.warn(`Primary provider ${this.activeProvider.name} failed: ${err.message}. Falling back to deterministic MockLlmProvider.`);
      return await this.fallbackMock.generateStructuredOutput(systemPrompt, userPrompt, allowedEvidenceIds);
    }
  }
}
