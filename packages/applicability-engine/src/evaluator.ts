import { RuleOperator, OrganizationProfile, ProfileFactItem } from '@impactlens/shared';

export function getFieldValue(profile: OrganizationProfile, fieldPath: string): any {
  if (!profile || !fieldPath) return undefined;

  // Handle profile facts explicitly: facts.FACT_NAME
  if (fieldPath.startsWith('facts.')) {
    const factType = fieldPath.replace('facts.', '');
    const foundFact = profile.facts?.find((f) => f.factType === factType);
    return foundFact ? foundFact.value : undefined;
  }

  // Handle products arrays: products.hsCodes, products.categories
  if (fieldPath === 'products.hsCodes') {
    return profile.products?.map((p) => p.hsCode).filter(Boolean) || [];
  }
  if (fieldPath === 'products.categories') {
    return profile.products?.map((p) => p.category).filter(Boolean) || [];
  }

  // Handle nested object paths safely
  const parts = fieldPath.split('.');
  let current: any = profile;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export interface ConditionEvaluationResult {
  matched: boolean;
  actual: any;
  reason: string;
}

export function evaluateCondition(
  actual: any,
  operator: RuleOperator,
  expected: any
): ConditionEvaluationResult {
  switch (operator) {
    case RuleOperator.EQUALS: {
      if (typeof actual === 'string' && typeof expected === 'string') {
        const matched = actual.trim().toLowerCase() === expected.trim().toLowerCase();
        return { matched, actual, reason: `Actual '${actual}' ${matched ? 'matches' : 'does not match'} expected '${expected}'` };
      }
      const matched = actual === expected;
      return { matched, actual, reason: `Actual '${actual}' ${matched ? '==' : '!='} expected '${expected}'` };
    }

    case RuleOperator.NOT_EQUALS: {
      if (typeof actual === 'string' && typeof expected === 'string') {
        const matched = actual.trim().toLowerCase() !== expected.trim().toLowerCase();
        return { matched, actual, reason: `Actual '${actual}' ${matched ? '!=' : '=='} expected '${expected}'` };
      }
      const matched = actual !== expected;
      return { matched, actual, reason: `Actual '${actual}' ${matched ? '!=' : '=='} expected '${expected}'` };
    }

    case RuleOperator.IN: {
      if (!Array.isArray(expected)) {
        return { matched: false, actual, reason: `Expected value for IN operator must be an array, received ${typeof expected}` };
      }
      const matched = expected.some((item) => {
        if (typeof item === 'string' && typeof actual === 'string') {
          return item.trim().toLowerCase() === actual.trim().toLowerCase();
        }
        return item === actual;
      });
      return { matched, actual, reason: `Value '${actual}' ${matched ? 'is present in' : 'is absent from'} [${expected.join(', ')}]` };
    }

    case RuleOperator.NOT_IN: {
      if (!Array.isArray(expected)) {
        return { matched: false, actual, reason: `Expected value for NOT_IN operator must be an array` };
      }
      const matched = !expected.some((item) => {
        if (typeof item === 'string' && typeof actual === 'string') {
          return item.trim().toLowerCase() === actual.trim().toLowerCase();
        }
        return item === actual;
      });
      return { matched, actual, reason: `Value '${actual}' ${matched ? 'is not in' : 'is unexpectedly in'} [${expected.join(', ')}]` };
    }

    case RuleOperator.CONTAINS: {
      if (Array.isArray(actual)) {
        const matched = actual.some((item) => {
          if (typeof item === 'string' && typeof expected === 'string') {
            return item.trim().toLowerCase() === expected.trim().toLowerCase();
          }
          return item === expected;
        });
        return { matched, actual, reason: `Array [${actual.join(', ')}] ${matched ? 'contains' : 'does not contain'} '${expected}'` };
      }
      if (typeof actual === 'string' && typeof expected === 'string') {
        const matched = actual.toLowerCase().includes(expected.toLowerCase());
        return { matched, actual, reason: `String '${actual}' ${matched ? 'contains' : 'does not contain'} '${expected}'` };
      }
      return { matched: false, actual, reason: `Cannot evaluate CONTAINS on non-array/non-string actual value` };
    }

    case RuleOperator.EXISTS: {
      const exists = actual !== undefined && actual !== null && actual !== '';
      const matched = Boolean(expected) ? exists : !exists;
      return { matched, actual, reason: `Field ${exists ? 'exists' : 'does not exist'}` };
    }

    case RuleOperator.NOT_EXISTS: {
      const notExists = actual === undefined || actual === null || actual === '';
      const matched = Boolean(expected) ? notExists : !notExists;
      return { matched, actual, reason: `Field ${notExists ? 'does not exist' : 'exists'}` };
    }

    case RuleOperator.STARTS_WITH: {
      if (Array.isArray(actual)) {
        const matched = actual.some((item) =>
          typeof item === 'string' && typeof expected === 'string'
            ? item.startsWith(expected)
            : false
        );
        return { matched, actual, reason: `Items in [${actual.join(', ')}] ${matched ? 'start with' : 'do not start with'} '${expected}'` };
      }
      if (typeof actual === 'string' && typeof expected === 'string') {
        const matched = actual.startsWith(expected);
        return { matched, actual, reason: `String '${actual}' ${matched ? 'starts with' : 'does not start with'} '${expected}'` };
      }
      return { matched: false, actual, reason: `Cannot evaluate STARTS_WITH on non-string/non-array value` };
    }

    case RuleOperator.RANGE: {
      if (!Array.isArray(expected) || expected.length !== 2) {
        return { matched: false, actual, reason: `RANGE expected value must be a 2-element tuple [min, max]` };
      }
      const [min, max] = expected;
      const num = Number(actual);
      if (isNaN(num)) {
        return { matched: false, actual, reason: `Cannot evaluate RANGE on non-numeric value: ${actual}` };
      }
      const matched = num >= min && num <= max;
      return { matched, actual, reason: `Value ${num} ${matched ? 'is within' : 'is outside'} range [${min}, ${max}]` };
    }

    default:
      return { matched: false, actual, reason: `Unsupported rule operator: ${operator}` };
  }
}
