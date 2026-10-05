import { StructuredAiOutput } from '@impactlens/shared';

export interface ILlmProvider {
  name: string;
  generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput>;
}
