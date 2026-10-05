import {
  SeverityLevel,
  ApplicabilityConfidence,
  PriorityLevel,
  ImpactDimension,
} from '@impactlens/shared';

export interface PriorityCalculationBreakdown {
  rawScore: number;
  normalizedScore: number; // 0 - 100
  priorityLevel: PriorityLevel;
  factors: {
    maxSeverity: SeverityLevel;
    severityWeight: number;
    applicabilityConfidence: ApplicabilityConfidence;
    confidenceWeight: number;
    deadlineUrgencyFactor: number;
    deadlineDaysRemaining: number | null;
    operationalBreadthFactor: number;
    affectedAreaCount: number;
  };
  explanation: string;
}

export function calculatePriorityScore(
  severities: SeverityLevel[],
  confidence: ApplicabilityConfidence,
  effectiveDateStr?: string | null,
  affectedAreas: ImpactDimension[] = []
): PriorityCalculationBreakdown {
  // 1. Severity weight
  const severityWeights: Record<SeverityLevel, number> = {
    [SeverityLevel.CRITICAL]: 4.0,
    [SeverityLevel.HIGH]: 3.0,
    [SeverityLevel.MEDIUM]: 2.0,
    [SeverityLevel.LOW]: 1.0,
    [SeverityLevel.NONE]: 0.2,
  };

  const maxSeverity = severities.reduce((prev, curr) => {
    return severityWeights[curr] > severityWeights[prev] ? curr : prev;
  }, SeverityLevel.NONE);

  const severityWeight = severityWeights[maxSeverity];

  // 2. Applicability confidence factor
  const confidenceWeights: Record<ApplicabilityConfidence, number> = {
    [ApplicabilityConfidence.HIGH]: 1.0,
    [ApplicabilityConfidence.MEDIUM]: 0.75,
    [ApplicabilityConfidence.LOW]: 0.4,
  };
  const confidenceWeight = confidenceWeights[confidence] ?? 0.75;

  // 3. Deadline urgency factor
  let deadlineDaysRemaining: number | null = null;
  let deadlineUrgencyFactor = 0.9; // default when no fixed deadline

  if (effectiveDateStr) {
    const effectiveDate = new Date(effectiveDateStr);
    if (!isNaN(effectiveDate.getTime())) {
      const now = new Date();
      const diffMs = effectiveDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      deadlineDaysRemaining = diffDays;

      if (diffDays <= 30) {
        deadlineUrgencyFactor = 1.5;
      } else if (diffDays <= 90) {
        deadlineUrgencyFactor = 1.25;
      } else {
        deadlineUrgencyFactor = 1.0;
      }
    }
  }

  // 4. Operational breadth factor
  const uniqueAreas = Array.from(new Set(affectedAreas));
  const areaCount = uniqueAreas.length;
  let operationalBreadthFactor = 1.0;
  if (areaCount >= 4) {
    operationalBreadthFactor = 1.4;
  } else if (areaCount >= 2) {
    operationalBreadthFactor = 1.2;
  }

  // Raw score = S * C * U * B
  const rawScore = Number((severityWeight * confidenceWeight * deadlineUrgencyFactor * operationalBreadthFactor).toFixed(3));

  // Max theoretical raw score = 4.0 * 1.0 * 1.5 * 1.4 = 8.4
  const normalizedScore = Math.min(100, Math.max(0, Math.round((rawScore / 8.4) * 100)));

  let priorityLevel = PriorityLevel.LOW;
  if (normalizedScore >= 75) {
    priorityLevel = PriorityLevel.CRITICAL;
  } else if (normalizedScore >= 50) {
    priorityLevel = PriorityLevel.HIGH;
  } else if (normalizedScore >= 25) {
    priorityLevel = PriorityLevel.MEDIUM;
  }

  const explanation = `Priority score ${normalizedScore}/100 (${priorityLevel}) computed from: Max Severity=${maxSeverity} (wt ${severityWeight}), Confidence=${confidence} (wt ${confidenceWeight}), Urgency=${deadlineUrgencyFactor}x (${deadlineDaysRemaining !== null ? `${deadlineDaysRemaining} days remaining` : 'standard timeline'}), Operational Breadth=${operationalBreadthFactor}x (${areaCount} affected functional areas).`;

  return {
    rawScore,
    normalizedScore,
    priorityLevel,
    factors: {
      maxSeverity,
      severityWeight,
      applicabilityConfidence: confidence,
      confidenceWeight,
      deadlineUrgencyFactor,
      deadlineDaysRemaining,
      operationalBreadthFactor,
      affectedAreaCount: areaCount,
    },
    explanation,
  };
}
