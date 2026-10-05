import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { AnthropicProvider } from './anthropic.provider';

@Global()
@Module({
  providers: [AiService, MockLlmProvider, OpenAiProvider, GeminiProvider, AnthropicProvider],
  exports: [AiService, MockLlmProvider],
})
export class AiModule {}
