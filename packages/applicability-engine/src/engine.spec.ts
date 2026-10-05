import { describe, it, expect } from 'vitest';
import {
  OrganizationProfile,
  OrganizationType,
  BusinessActivityType,
  RegulatoryChangePayload,
  ChangeType,
  RegulatoryTopic,
  ApplicabilityStatus,
} from '@impactlens/shared';
import { ApplicabilityEngine } from './engine';

describe('Applicability Engine Test Suite', () => {
  const engine = new ApplicabilityEngine();

  const syntheticRegulation: RegulatoryChangePayload = {
    document: {
      title: 'Thông tư quy định về hồ sơ hải quan đối với hàng hóa xuất nhập khẩu',
      documentNumber: '39/2026/TT-BTC',
      authority: 'Bộ Tài chính',
      effectiveAt: '2026-11-01T00:00:00Z',
    },
    changes: [
      {
        changeType: ChangeType.MODIFIED,
        hierarchyPath: 'Điều 8 > Khoản 1 & 2',
        oldContent: '1. Doanh nghiệp nhập khẩu nộp tài liệu A khi thực hiện thủ tục hải quan. 2. Hồ sơ được lưu trong thời hạn 2 năm.',
        newContent: '1. Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi thực hiện thủ tục hải quan. 2. Hồ sơ được lưu trong thời hạn 5 năm. 3. Tài liệu phải được lưu dưới dạng điện tử.',
        topics: [RegulatoryTopic.DOCUMENT_REQUIREMENT, RegulatoryTopic.RECORD_RETENTION, RegulatoryTopic.IT_REQUIREMENT],
      },
    ],
    topics: [RegulatoryTopic.CUSTOMS_PROCEDURE, RegulatoryTopic.DOCUMENT_REQUIREMENT, RegulatoryTopic.RECORD_RETENTION],
  };

  it('Case 1: Importer company -> APPLIES or POTENTIALLY_APPLIES with clear matched rules and facts', () => {
    const importProfile: OrganizationProfile = {
      id: 'org-demo-mfg',
      legalName: 'DEMO IMPORT MANUFACTURING CO.',
      displayName: 'Demo Import Mfg',
      organizationType: OrganizationType.FDI_ENTERPRISE,
      country: 'VIETNAM',
      jurisdictions: ['VIETNAM'],
      industry: 'Manufacturing',
      businessModel: 'B2B',
      active: true,
      businessActivities: [BusinessActivityType.IMPORT, BusinessActivityType.MANUFACTURING, BusinessActivityType.EXPORT],
      facilities: [],
      products: [],
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
      facts: [],
      profileVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = engine.evaluate(importProfile, syntheticRegulation, ['EV-001', 'EV-002']);

    expect([ApplicabilityStatus.APPLIES, ApplicabilityStatus.POTENTIALLY_APPLIES]).toContain(result.status);
    expect(result.matchedRules.length).toBeGreaterThan(0);
    expect(result.reasoningFactors.some((r) => r.includes('IMPORT'))).toBe(true);
    expect(result.missingInformation).toHaveLength(0);
    expect(result.legalEvidenceUsed).toContain('EV-001');
  });

  it('Case 2: Service consulting company -> DOES_NOT_APPLY with clear non-trade reasoning', () => {
    const serviceProfile: OrganizationProfile = {
      id: 'org-demo-consulting',
      legalName: 'DEMO LOCAL SERVICE CO.',
      displayName: 'Demo Local Service',
      organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
      country: 'VIETNAM',
      jurisdictions: ['VIETNAM'],
      industry: 'Professional Services',
      businessModel: 'B2B',
      active: true,
      businessActivities: [BusinessActivityType.CONSULTING],
      facilities: [],
      products: [],
      customsProfile: {
        isImporter: false,
        isExporter: false,
        isCustomsBroker: false,
        isFdi: false,
        isExportProcessingEnterprise: false,
        isBondedWarehouseOperator: false,
        isManufacturingForExport: false,
        isProcessingEnterprise: false,
      },
      facts: [],
      profileVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = engine.evaluate(serviceProfile, syntheticRegulation, ['EV-001']);

    expect(result.status).toBe(ApplicabilityStatus.DOES_NOT_APPLY);
    expect(result.reasoningFactors.some((r) => r.toLowerCase().includes('consulting'))).toBe(true);
    expect(result.matchedRules.some((r) => r.ruleId === 'RULE_NON_IMPORT_EXCLUSION')).toBe(true);
  });

  it('Case 3: Incomplete profile company -> INSUFFICIENT_INFORMATION without hallucinating facts', () => {
    const unknownProfile: OrganizationProfile = {
      id: 'org-demo-unknown',
      legalName: 'DEMO UNKNOWN TRADING CO.',
      displayName: 'Demo Unknown Trading',
      organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
      country: 'VIETNAM',
      jurisdictions: ['VIETNAM'],
      industry: 'General Trading',
      businessModel: 'Wholesale',
      active: true,
      businessActivities: [], // Empty/unspecified!
      facilities: [],
      products: [],
      customsProfile: {
        isImporter: null, // Unknown!
        isExporter: null,
        isCustomsBroker: false,
        isFdi: false,
        isExportProcessingEnterprise: false,
        isBondedWarehouseOperator: false,
        isManufacturingForExport: false,
        isProcessingEnterprise: false,
      },
      facts: [],
      profileVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = engine.evaluate(unknownProfile, syntheticRegulation, ['EV-001']);

    expect(result.status).toBe(ApplicabilityStatus.INSUFFICIENT_INFORMATION);
    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(result.missingInformation.some((m) => m.toLowerCase().includes('import'))).toBe(true);
  });
});
