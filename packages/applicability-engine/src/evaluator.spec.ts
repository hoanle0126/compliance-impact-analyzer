import { describe, it, expect } from 'vitest';
import { RuleOperator, OrganizationProfile, OrganizationType, BusinessActivityType } from '@impactlens/shared';
import { evaluateCondition, getFieldValue } from './evaluator';

describe('Condition Evaluator', () => {
  it('evaluates EQUALS correctly', () => {
    expect(evaluateCondition('IMPORT', RuleOperator.EQUALS, 'IMPORT').matched).toBe(true);
    expect(evaluateCondition('import', RuleOperator.EQUALS, 'IMPORT').matched).toBe(true);
    expect(evaluateCondition('EXPORT', RuleOperator.EQUALS, 'IMPORT').matched).toBe(false);
  });

  it('evaluates CONTAINS on array and string', () => {
    expect(evaluateCondition(['IMPORT', 'MANUFACTURING'], RuleOperator.CONTAINS, 'IMPORT').matched).toBe(true);
    expect(evaluateCondition(['CONSULTING'], RuleOperator.CONTAINS, 'IMPORT').matched).toBe(false);
    expect(evaluateCondition('Customs declaration requirements', RuleOperator.CONTAINS, 'declaration').matched).toBe(true);
  });

  it('evaluates IN and NOT_IN correctly', () => {
    expect(evaluateCondition('IMPORT', RuleOperator.IN, ['IMPORT', 'EXPORT']).matched).toBe(true);
    expect(evaluateCondition('LOGISTICS', RuleOperator.IN, ['IMPORT', 'EXPORT']).matched).toBe(false);
    expect(evaluateCondition('LOGISTICS', RuleOperator.NOT_IN, ['IMPORT', 'EXPORT']).matched).toBe(true);
  });

  it('evaluates STARTS_WITH for HS code matching', () => {
    expect(evaluateCondition(['8471.30.00', '8504.40.10'], RuleOperator.STARTS_WITH, '8471').matched).toBe(true);
    expect(evaluateCondition(['2710.12.11'], RuleOperator.STARTS_WITH, '8471').matched).toBe(false);
  });

  it('evaluates RANGE correctly', () => {
    expect(evaluateCondition(5, RuleOperator.RANGE, [2, 10]).matched).toBe(true);
    expect(evaluateCondition(15, RuleOperator.RANGE, [2, 10]).matched).toBe(false);
  });

  it('extracts nested and fact fields safely', () => {
    const mockProfile: OrganizationProfile = {
      id: 'org-1',
      legalName: 'Test Corp',
      displayName: 'Test',
      organizationType: OrganizationType.FDI_ENTERPRISE,
      country: 'VN',
      jurisdictions: ['VN', 'US'],
      industry: 'Electronics',
      businessModel: 'B2B',
      active: true,
      businessActivities: [BusinessActivityType.IMPORT, BusinessActivityType.MANUFACTURING],
      facilities: [],
      products: [{ category: 'Electronics', hsCode: '8542.31.00', description: 'Processors', originCountries: ['JP'], destinationCountries: ['US'], isControlled: false }],
      customsProfile: {
        isImporter: true,
        isExporter: true,
        isCustomsBroker: false,
        isFdi: true,
        isExportProcessingEnterprise: false,
        isBondedWarehouseOperator: false,
        isManufacturingForExport: true,
        isProcessingEnterprise: false,
      },
      facts: [{ factType: 'USES_IMPORTED_RAW_MATERIALS', value: true, source: 'USER_PROVIDED' as any, confidence: 'VERIFIED' as any }],
      profileVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(getFieldValue(mockProfile, 'businessActivities')).toEqual(['IMPORT', 'MANUFACTURING']);
    expect(getFieldValue(mockProfile, 'customsProfile.isImporter')).toBe(true);
    expect(getFieldValue(mockProfile, 'facts.USES_IMPORTED_RAW_MATERIALS')).toBe(true);
    expect(getFieldValue(mockProfile, 'products.hsCodes')).toEqual(['8542.31.00']);
  });
});
