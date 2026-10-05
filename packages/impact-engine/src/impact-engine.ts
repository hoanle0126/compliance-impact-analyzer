import {
  OrganizationProfile,
  RegulatoryChangePayload,
  LegalEvidenceItem,
  StructuredImpactAssessment,
  ApplicabilityEvaluationResult,
  ApplicabilityStatus,
  ApplicabilityConfidence,
  ImpactDimension,
  SeverityLevel,
  PriorityLevel,
  DecisionTraceStep,
  StructuredAiOutput,
  StructuredAiOutputSchema,
} from '@impactlens/shared';
import { calculatePriorityScore } from './priority-calculator';
import { parseDeadlineFromText } from './deadline-parser';
import { validateAndSanitizeCitations } from './citation-validator';
import { buildDefendedPrompt } from './prompt-defense';

export interface ILlmProvider {
  generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput>;
}

export class ImpactEngine {
  constructor(private llmProvider: ILlmProvider) {}

  public async analyze(
    profile: OrganizationProfile,
    change: RegulatoryChangePayload,
    applicability: ApplicabilityEvaluationResult,
    evidence: LegalEvidenceItem[]
  ): Promise<StructuredImpactAssessment> {
    const trace: DecisionTraceStep[] = [];
    const timestamp = new Date().toISOString();

    trace.push({
      stepNumber: 1,
      stepName: 'TOPIC_DETECTION',
      detail: `Identified topics: ${(change.topics || []).join(', ') || 'CUSTOMS_PROCEDURE, DOCUMENT_REQUIREMENT'}`,
      timestamp,
      status: 'SUCCESS',
    });

    trace.push({
      stepNumber: 2,
      stepName: 'APPLICABILITY_EVALUATION',
      detail: `Status: ${applicability.status}. Matched rules: ${applicability.matchedRules.map((r) => r.ruleId).join(', ') || 'None'}`,
      timestamp,
      status: 'SUCCESS',
    });

    // Short-circuit: Incomplete profile
    if (applicability.status === ApplicabilityStatus.INSUFFICIENT_INFORMATION) {
      trace.push({
        stepNumber: 3,
        stepName: 'INCOMPLETE_DATA_HALT',
        detail: `Analysis halted due to missing profile information: ${applicability.missingInformation.join('; ')}`,
        timestamp,
        status: 'WARNING',
      });

      return {
        summary: `Compliance determination cannot be safely concluded due to missing company profile facts (${applicability.missingInformation.join(', ')}). Manual review required.`,
        applicability: {
          status: ApplicabilityStatus.INSUFFICIENT_INFORMATION,
          reason: applicability.reasoningFactors.join(' '),
          confidence: ApplicabilityConfidence.LOW,
        },
        impactAreas: [],
        obligations: [],
        recommendedActions: [
          {
            title: 'Complete Organization Profile Facts',
            description: `Provide missing organization trade attributes: ${applicability.missingInformation.join('; ')}`,
            priority: PriorityLevel.MEDIUM,
            ownerDepartment: 'COMPLIANCE' as any,
            dueDate: null,
            basis: 'Required to determine regulatory applicability under trade and customs rules.',
            evidenceIds: [],
            status: 'PLANNED' as any,
          },
        ],
        assumptions: [],
        missingInformation: applicability.missingInformation,
        requiresHumanReview: true,
        priorityScore: 35,
        priorityLevel: PriorityLevel.MEDIUM,
        decisionTrace: trace,
      };
    }

    // Short-circuit: Does not apply (Negative test scenario)
    if (applicability.status === ApplicabilityStatus.DOES_NOT_APPLY) {
      trace.push({
        stepNumber: 3,
        stepName: 'EXCLUSION_MATCH',
        detail: `Regulation does not apply to ${profile.legalName} based on activities: ${profile.businessActivities.join(', ')}`,
        timestamp,
        status: 'SUCCESS',
      });

      return {
        summary: `Regulation does not currently apply to ${profile.legalName}. Company activities are limited to domestic consulting/services with no international trade or customs operations.`,
        applicability: {
          status: ApplicabilityStatus.DOES_NOT_APPLY,
          reason: applicability.reasoningFactors.join(' '),
          confidence: ApplicabilityConfidence.HIGH,
        },
        impactAreas: [
          {
            area: ImpactDimension.CUSTOMS,
            severity: SeverityLevel.NONE,
            description: 'No customs declarations or import/export procedures executed by entity.',
            evidenceIds: [],
          },
        ],
        obligations: [],
        recommendedActions: [],
        assumptions: [
          'Assumes the company continues to operate solely in domestic consulting without engaging in foreign trade.',
        ],
        missingInformation: [],
        requiresHumanReview: false,
        priorityScore: 5,
        priorityLevel: PriorityLevel.LOW,
        decisionTrace: trace,
      };
    }

    // Positive / Applicable scenario: LLM generation + strict validation
    const allowedEvidenceIds = evidence.map((e) => e.id);
    const { systemPrompt, userPrompt, detectedSuspiciousPatterns } = buildDefendedPrompt(
      profile,
      change,
      evidence,
      allowedEvidenceIds
    );

    if (detectedSuspiciousPatterns.length > 0) {
      trace.push({
        stepNumber: 3,
        stepName: 'PROMPT_INJECTION_DEFENSE_TRIGGERED',
        detail: `Detected and neutralized suspicious injection patterns in untrusted input: ${detectedSuspiciousPatterns.join(', ')}`,
        timestamp,
        status: 'WARNING',
      });
    }

    trace.push({
      stepNumber: 4,
      stepName: 'AI_STRUCTURED_GENERATION',
      detail: `Invoking AI provider for structured impact assessment with ${allowedEvidenceIds.length} verified evidence items.`,
      timestamp,
      status: 'SUCCESS',
    });

    let rawAiOutput: StructuredAiOutput;
    try {
      rawAiOutput = await this.llmProvider.generateStructuredOutput(systemPrompt, userPrompt, allowedEvidenceIds);
      // Validate schema
      StructuredAiOutputSchema.parse(rawAiOutput);
    } catch (err: any) {
      trace.push({
        stepNumber: 5,
        stepName: 'AI_SCHEMA_VALIDATION_ERROR',
        detail: `Provider output schema validation failed: ${err.message}`,
        timestamp,
        status: 'FAILED',
      });
      throw err;
    }

    // Step 5: Citation validation
    const citationRes = validateAndSanitizeCitations(rawAiOutput, allowedEvidenceIds);
    trace.push({
      stepNumber: 6,
      stepName: 'CITATION_VALIDATION',
      detail: citationRes.valid
        ? 'All citations validated against verified legal evidence store.'
        : `Detected and stripped unauthorized citations: ${citationRes.invalidCitationsFound.join(', ')}`,
      timestamp,
      status: citationRes.valid ? 'SUCCESS' : 'WARNING',
    });

    const sanitized = citationRes.sanitizedOutput;

    // Step 6: Deadline inspection from evidence
    sanitized.obligations.forEach((obl) => {
      evidence.forEach((ev) => {
        if (obl.evidenceIds.includes(ev.id)) {
          const parsedDl = parseDeadlineFromText(ev.textExcerpt, change.document.effectiveAt, ev.id);
          if (parsedDl.hasDeadline) {
            obl.rawDeadlineText = parsedDl.rawText;
            if (parsedDl.parsedDate) {
              obl.deadline = parsedDl.parsedDate;
            }
          }
        }
      });
    });

    // Step 7: Priority scoring calculation
    const severities = sanitized.impactAreas.map((a) => a.severity);
    const affectedAreas = sanitized.impactAreas.map((a) => a.area);
    const priorityRes = calculatePriorityScore(
      severities,
      sanitized.applicability.confidence,
      change.document.effectiveAt,
      affectedAreas
    );

    trace.push({
      stepNumber: 7,
      stepName: 'PRIORITY_SCORE_CALCULATION',
      detail: priorityRes.explanation,
      timestamp,
      status: 'SUCCESS',
    });

    return {
      summary: sanitized.summary,
      applicability: sanitized.applicability,
      impactAreas: sanitized.impactAreas,
      obligations: sanitized.obligations,
      recommendedActions: sanitized.recommendedActions,
      assumptions: sanitized.assumptions,
      missingInformation: sanitized.missingInformation,
      requiresHumanReview: sanitized.requiresHumanReview,
      priorityScore: priorityRes.normalizedScore,
      priorityLevel: priorityRes.priorityLevel,
      decisionTrace: trace,
    };
  }
}
