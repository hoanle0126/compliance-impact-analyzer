import { describe, it, expect } from 'vitest';
import { SeverityLevel, ApplicabilityConfidence, PriorityLevel, ImpactDimension } from '@impactlens/shared';
import { calculatePriorityScore } from './priority-calculator';

describe('Priority Calculator Test Suite', () => {
  it('computes HIGH/CRITICAL priority for severe impact with high confidence and broad scope', () => {
    const result = calculatePriorityScore(
      [SeverityLevel.HIGH, SeverityLevel.MEDIUM],
      ApplicabilityConfidence.HIGH,
      new Date(Date.now() + 15 * 86400000).toISOString(), // 15 days remaining
      [ImpactDimension.CUSTOMS, ImpactDimension.DOCUMENTATION, ImpactDimension.RECORD_RETENTION, ImpactDimension.IT_DATA]
    );

    expect(result.normalizedScore).toBeGreaterThanOrEqual(50);
    expect([PriorityLevel.HIGH, PriorityLevel.CRITICAL]).toContain(result.priorityLevel);
    expect(result.factors.severityWeight).toBe(3.0);
    expect(result.factors.confidenceWeight).toBe(1.0);
    expect(result.factors.deadlineUrgencyFactor).toBe(1.5);
    expect(result.factors.operationalBreadthFactor).toBe(1.4);
    expect(result.explanation).toContain('Priority score');
  });

  it('computes LOW priority for negligible severity and low urgency', () => {
    const result = calculatePriorityScore(
      [SeverityLevel.LOW],
      ApplicabilityConfidence.LOW,
      new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year remaining
      [ImpactDimension.OPERATIONS]
    );

    expect(result.normalizedScore).toBeLessThan(30);
    expect(result.priorityLevel).toBe(PriorityLevel.LOW);
  });
});
