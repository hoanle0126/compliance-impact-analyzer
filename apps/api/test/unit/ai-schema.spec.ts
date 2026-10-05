import { describe, it, expect } from 'vitest';
import { StructuredAiOutputSchema } from '@impactlens/shared';

describe('Structured AI Output Schema Validation', () => {
  it('accepts compliant structured AI output payload', () => {
    const valid = {
      summary: 'Comprehensive customs documentation update applies to importing enterprise.',
      applicability: {
        status: 'POTENTIALLY_APPLIES',
        reason: 'Organization performs import transactions.',
        confidence: 'HIGH',
      },
      impactAreas: [
        {
          area: 'CUSTOMS',
          severity: 'HIGH',
          description: 'Document B required at import declaration.',
          evidenceIds: ['EV-001'],
        },
      ],
      obligations: [
        {
          title: 'Submit Document B',
          description: 'Submit supporting Document B with import declaration.',
          obligationType: 'FILE',
          responsibleDepartment: 'CUSTOMS',
          evidenceIds: ['EV-001'],
          confidence: 'HIGH',
          requiresReview: false,
        },
      ],
      recommendedActions: [
        {
          title: 'Review Declaration Pack',
          description: 'Ensure customs broker has Document B.',
          priority: 'HIGH',
          ownerDepartment: 'CUSTOMS',
          basis: 'Article 8 Clause 1',
          evidenceIds: ['EV-001'],
          status: 'PLANNED',
        },
      ],
      assumptions: ['Assuming direct maritime import'],
      missingInformation: [],
      requiresHumanReview: true,
    };

    expect(() => StructuredAiOutputSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid enum or missing mandatory fields', () => {
    const invalid = {
      summary: 'Short', // Less than 10 characters!
      applicability: {
        status: 'INVALID_STATUS', // Non-existent enum!
        reason: 'Too short',
        confidence: 'SUPER_HIGH',
      },
      impactAreas: [],
      obligations: [],
      recommendedActions: [],
    };

    expect(() => StructuredAiOutputSchema.parse(invalid)).toThrow();
  });
});
