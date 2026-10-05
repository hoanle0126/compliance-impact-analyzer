import { StructuredAiOutput } from '@impactlens/shared';

export interface CitationValidationResult {
  valid: boolean;
  allowedEvidenceIds: string[];
  invalidCitationsFound: string[];
  sanitizedOutput: StructuredAiOutput;
  errors: string[];
}

export function validateAndSanitizeCitations(
  aiOutput: StructuredAiOutput,
  allowedEvidenceIds: string[]
): CitationValidationResult {
  const allowedSet = new Set(allowedEvidenceIds);
  const invalidCitations = new Set<string>();
  const errors: string[] = [];

  // Deep clone to avoid mutating input directly
  const sanitized: StructuredAiOutput = JSON.parse(JSON.stringify(aiOutput));

  // 1. Validate impactAreas
  sanitized.impactAreas.forEach((area) => {
    const validIds: string[] = [];
    area.evidenceIds.forEach((id) => {
      if (allowedSet.has(id)) {
        validIds.push(id);
      } else {
        invalidCitations.add(id);
        errors.push(`ImpactArea '${area.area}' cited unverified evidence '${id}'`);
      }
    });
    area.evidenceIds = validIds;
  });

  // 2. Validate obligations
  sanitized.obligations.forEach((obl) => {
    const validIds: string[] = [];
    obl.evidenceIds.forEach((id) => {
      if (allowedSet.has(id)) {
        validIds.push(id);
      } else {
        invalidCitations.add(id);
        errors.push(`Obligation '${obl.title}' cited unverified evidence '${id}'`);
      }
    });
    obl.evidenceIds = validIds;
  });

  // 3. Validate recommendedActions
  sanitized.recommendedActions.forEach((act) => {
    const validIds: string[] = [];
    act.evidenceIds.forEach((id) => {
      if (allowedSet.has(id)) {
        validIds.push(id);
      } else {
        invalidCitations.add(id);
        errors.push(`RecommendedAction '${act.title}' cited unverified evidence '${id}'`);
      }
    });
    act.evidenceIds = validIds;
  });

  const invalidList = Array.from(invalidCitations);
  const isValid = invalidList.length === 0;

  if (!isValid) {
    sanitized.requiresHumanReview = true;
    sanitized.assumptions.push(
      `Citation validator detected and stripped unverified evidence IDs: [${invalidList.join(', ')}]. Verification by compliance officer required.`
    );
  }

  return {
    valid: isValid,
    allowedEvidenceIds,
    invalidCitationsFound: invalidList,
    sanitizedOutput: sanitized,
    errors,
  };
}
