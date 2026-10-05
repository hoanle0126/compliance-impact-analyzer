import { describe, it, expect } from 'vitest';
import {
  StructuredAiOutput,
  ApplicabilityStatus,
  ApplicabilityConfidence,
  ImpactDimension,
  SeverityLevel,
  PriorityLevel,
  ObligationType,
  ActionOwner,
  ActionStatus,
} from '@impactlens/shared';
import { validateAndSanitizeCitations } from './citation-validator';

describe('Citation Validator Test Suite', () => {
  const sampleAiOutput: StructuredAiOutput = {
    summary: 'Customs declaration and documentation changes apply to the enterprise.',
    applicability: {
      status: ApplicabilityStatus.POTENTIALLY_APPLIES,
      reason: 'Company imports regulated raw materials.',
      confidence: ApplicabilityConfidence.HIGH,
    },
    impactAreas: [
      {
        area: ImpactDimension.CUSTOMS,
        severity: SeverityLevel.HIGH,
        description: 'New mandatory supporting document required at declaration.',
        evidenceIds: ['EV-001', 'EV-999'], // EV-999 is fake!
      },
    ],
    obligations: [
      {
        title: 'Submit Document B',
        description: 'Provide Document B with import declaration.',
        obligationType: ObligationType.FILE,
        responsibleDepartment: ActionOwner.CUSTOMS,
        effectiveFrom: null,
        deadline: null,
        rawDeadlineText: null,
        evidenceIds: ['EV-001'],
        confidence: ApplicabilityConfidence.HIGH,
        requiresReview: false,
      },
    ],
    recommendedActions: [
      {
        title: 'Update Declaration Checklist',
        description: 'Ensure customs broker has Document B template.',
        priority: PriorityLevel.HIGH,
        ownerDepartment: ActionOwner.CUSTOMS,
        dueDate: null,
        basis: 'Mandated by modified Article 8 clause 1.',
        evidenceIds: ['EV-999'], // EV-999 is fake!
        status: ActionStatus.PLANNED,
      },
    ],
    assumptions: [],
    missingInformation: [],
    requiresHumanReview: false,
  };

  it('rejects fake citation EV-999 and sanitizes it from output', () => {
    const allowedIds = ['EV-001', 'EV-002'];
    const result = validateAndSanitizeCitations(sampleAiOutput, allowedIds);

    expect(result.valid).toBe(false);
    expect(result.invalidCitationsFound).toContain('EV-999');
    expect(result.sanitizedOutput.impactAreas[0].evidenceIds).toEqual(['EV-001']);
    expect(result.sanitizedOutput.recommendedActions[0].evidenceIds).toEqual([]);
    expect(result.sanitizedOutput.requiresHumanReview).toBe(true);
    expect(result.sanitizedOutput.assumptions.some((a) => a.includes('EV-999'))).toBe(true);
  });

  it('passes completely when only allowed citations are referenced', () => {
    const validAiOutput: StructuredAiOutput = {
      ...sampleAiOutput,
      impactAreas: [{ ...sampleAiOutput.impactAreas[0], evidenceIds: ['EV-001'] }],
      recommendedActions: [{ ...sampleAiOutput.recommendedActions[0], evidenceIds: ['EV-001'] }],
    };

    const result = validateAndSanitizeCitations(validAiOutput, ['EV-001', 'EV-002']);
    expect(result.valid).toBe(true);
    expect(result.invalidCitationsFound).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
