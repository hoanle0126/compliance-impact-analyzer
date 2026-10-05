import { PrismaClient, UserRole, OrganizationType, BusinessActivityType, FactSource, FactConfidence, ChangeType, ApplicabilityStatus, SeverityLevel, PriorityLevel, AnalysisWorkflowStatus, ObligationType, ActionOwner, ActionStatus, EvidenceSource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ImpactLens database...');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@impactlens.local' },
    update: {},
    create: {
      email: 'admin@impactlens.local',
      fullName: 'System Administrator',
      passwordHash,
      globalRole: UserRole.SYSTEM_ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@impactlens.local' },
    update: {},
    create: {
      email: 'manager@impactlens.local',
      fullName: 'Chief Compliance Manager',
      passwordHash,
      globalRole: UserRole.COMPLIANCE_MANAGER,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@impactlens.local' },
    update: {},
    create: {
      email: 'analyst@impactlens.local',
      fullName: 'Senior Trade Analyst',
      passwordHash,
      globalRole: UserRole.ANALYST,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@impactlens.local' },
    update: {},
    create: {
      email: 'reviewer@impactlens.local',
      fullName: 'Legal Counsel Reviewer',
      passwordHash,
      globalRole: UserRole.REVIEWER,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@impactlens.local' },
    update: {},
    create: {
      email: 'viewer@impactlens.local',
      fullName: 'Executive Board Viewer',
      passwordHash,
      globalRole: UserRole.VIEWER,
    },
  });

  console.log('Users seeded successfully.');

  // 2. Seed Demo Organizations
  // Organization 1: DEMO IMPORT MANUFACTURING CO. (Positive Scenario)
  let orgMfg = await prisma.organization.findFirst({
    where: { legalName: 'DEMO IMPORT MANUFACTURING CO.' },
  });

  if (!orgMfg) {
    orgMfg = await prisma.organization.create({
      data: {
        legalName: 'DEMO IMPORT MANUFACTURING CO.',
        displayName: 'Demo Import Mfg',
        organizationType: OrganizationType.FDI_ENTERPRISE,
        taxId: '0109988776',
        country: 'VIETNAM',
        jurisdictions: ['VIETNAM', 'JAPAN', 'SOUTH_KOREA', 'UNITED_STATES', 'EU'],
        industry: 'Electronics & High-Tech Manufacturing',
        businessModel: 'FDI Export Manufacturing',
        employeeRange: '500-1000',
        active: true,
        profileVersion: 1,
        activities: {
          create: [
            { activityType: BusinessActivityType.IMPORT },
            { activityType: BusinessActivityType.MANUFACTURING },
            { activityType: BusinessActivityType.EXPORT },
          ],
        },
        facilities: {
          create: [
            {
              name: 'Hai Phong Hi-Tech Factory',
              location: 'Dinh Vu Industrial Zone, Hai Phong',
              facilityType: 'FACTORY',
              customsArea: 'NON_BONDED',
              isBonded: false,
              processingActivity: 'Electronic assembly',
            },
            {
              name: 'Bac Ninh Component Warehouse',
              location: 'VSIP Bac Ninh',
              facilityType: 'WAREHOUSE',
              customsArea: 'BONDED',
              isBonded: true,
              processingActivity: 'Material storage and customs consolidation',
            },
          ],
        },
        products: {
          create: [
            {
              category: 'Electronic Components',
              hsCode: '8542.31.00',
              description: 'Processors and controllers, whether or not combined with memories',
              originCountries: ['JAPAN', 'SOUTH_KOREA'],
              destinationCountries: ['UNITED_STATES', 'GERMANY', 'JAPAN'],
              isControlled: false,
            },
          ],
        },
        facts: {
          create: [
            {
              factType: 'USES_IMPORTED_RAW_MATERIALS',
              valueJson: true,
              source: FactSource.USER_PROVIDED,
              confidence: FactConfidence.VERIFIED,
              notes: 'Raw materials imported under customs processing and manufacturing exemptions.',
            },
            {
              factType: 'HAS_ELECTRONIC_ARCHIVE_SYSTEM',
              valueJson: false,
              source: FactSource.USER_PROVIDED,
              confidence: FactConfidence.VERIFIED,
              notes: 'Currently paper-based record archive with 2-year retention lifecycle.',
            },
          ],
        },
      },
    });

    // Create Initial Profile Version Snapshot
    await prisma.organizationProfileVersion.create({
      data: {
        organizationId: orgMfg.id,
        versionNumber: 1,
        changeReason: 'Initial setup of synthetic demo import manufacturing organization',
        createdByUserId: admin.id,
        profileSnapshot: {
          legalName: orgMfg.legalName,
          organizationType: orgMfg.organizationType,
          activities: ['IMPORT', 'MANUFACTURING', 'EXPORT'],
          customs: { isImporter: true, isExporter: true, isFdi: true },
          facts: { USES_IMPORTED_RAW_MATERIALS: true },
        },
      },
    });
  }

  // Organization 2: DEMO LOCAL SERVICE CO. (Negative Scenario - DOES_NOT_APPLY)
  let orgService = await prisma.organization.findFirst({
    where: { legalName: 'DEMO LOCAL SERVICE CO.' },
  });

  if (!orgService) {
    orgService = await prisma.organization.create({
      data: {
        legalName: 'DEMO LOCAL SERVICE CO.',
        displayName: 'Demo Local Service',
        organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
        taxId: '0101122334',
        country: 'VIETNAM',
        jurisdictions: ['VIETNAM'],
        industry: 'Management & IT Consulting',
        businessModel: 'Domestic B2B Professional Services',
        employeeRange: '20-50',
        active: true,
        profileVersion: 1,
        activities: {
          create: [{ activityType: BusinessActivityType.CONSULTING }],
        },
        facilities: {
          create: [
            {
              name: 'Hanoi Headquarters Office',
              location: 'Keangnam Landmark 72, Hanoi',
              facilityType: 'OFFICE',
              customsArea: 'DOMESTIC',
              isBonded: false,
            },
          ],
        },
        facts: {
          create: [
            {
              factType: 'USES_IMPORTED_RAW_MATERIALS',
              valueJson: false,
              source: FactSource.USER_PROVIDED,
              confidence: FactConfidence.VERIFIED,
              notes: 'Pure domestic service business, zero customs transactions.',
            },
          ],
        },
      },
    });

    await prisma.organizationProfileVersion.create({
      data: {
        organizationId: orgService.id,
        versionNumber: 1,
        changeReason: 'Initial profile for domestic consulting service company',
        createdByUserId: admin.id,
        profileSnapshot: {
          legalName: orgService.legalName,
          activities: ['CONSULTING'],
          customs: { isImporter: false, isExporter: false },
        },
      },
    });
  }

  // Organization 3: DEMO UNKNOWN TRADING CO. (Incomplete Profile Scenario - INSUFFICIENT_INFORMATION)
  let orgUnknown = await prisma.organization.findFirst({
    where: { legalName: 'DEMO UNKNOWN TRADING CO.' },
  });

  if (!orgUnknown) {
    orgUnknown = await prisma.organization.create({
      data: {
        legalName: 'DEMO UNKNOWN TRADING CO.',
        displayName: 'Demo Unknown Trading',
        organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
        country: 'VIETNAM',
        jurisdictions: ['VIETNAM'],
        industry: 'General Commerce',
        businessModel: 'Wholesale Trade',
        active: true,
        profileVersion: 1,
      },
    });

    await prisma.organizationProfileVersion.create({
      data: {
        organizationId: orgUnknown.id,
        versionNumber: 1,
        changeReason: 'Initial unverified profile without trade attributes',
        createdByUserId: admin.id,
        profileSnapshot: {
          legalName: orgUnknown.legalName,
          activities: [],
          customs: {},
        },
      },
    });
  }

  // Assign memberships for tenant testing
  const allOrgs = [orgMfg, orgService, orgUnknown];
  for (const org of allOrgs) {
    await prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId: admin.id, organizationId: org.id } },
      update: {},
      create: { userId: admin.id, organizationId: org.id, role: UserRole.SYSTEM_ADMIN },
    });
    await prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId: manager.id, organizationId: org.id } },
      update: {},
      create: { userId: manager.id, organizationId: org.id, role: UserRole.COMPLIANCE_MANAGER },
    });
    await prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId: analyst.id, organizationId: org.id } },
      update: {},
      create: { userId: analyst.id, organizationId: org.id, role: UserRole.ANALYST },
    });
    await prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId: reviewer.id, organizationId: org.id } },
      update: {},
      create: { userId: reviewer.id, organizationId: org.id, role: UserRole.REVIEWER },
    });
    await prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId: viewer.id, organizationId: org.id } },
      update: {},
      create: { userId: viewer.id, organizationId: org.id, role: UserRole.VIEWER },
    });
  }

  console.log('Demo organizations and memberships created.');

  // 3. Seed Synthetic Demo Regulation
  let regChange = await prisma.regulatoryChange.findFirst({
    where: { documentNumber: '39/2026/TT-BTC' },
  });

  if (!regChange) {
    regChange = await prisma.regulatoryChange.create({
      data: {
        title: 'Thông tư sửa đổi, bổ sung quy định về hồ sơ hải quan và quản lý chứng từ hàng hóa xuất nhập khẩu',
        documentNumber: '39/2026/TT-BTC',
        authority: 'Bộ Tài chính - Tổng cục Hải quan',
        sourceUrl: 'https://thuvienphapluat.vn/van-ban/xuat-nhap-khau/thong-tu-39-2026-tt-btc-ho-so-hai-quan.aspx',
        effectiveAt: new Date(Date.now() + 25 * 86400000), // Effective in 25 days
        promulgatedAt: new Date(Date.now() - 10 * 86400000),
        jurisdiction: 'VIETNAM',
        status: 'ACTIVE',
        version: '1.0',
        topics: ['CUSTOMS_PROCEDURE', 'DOCUMENT_REQUIREMENT', 'RECORD_RETENTION', 'IT_REQUIREMENT'],
        changes: {
          create: [
            {
              changeType: ChangeType.MODIFIED,
              hierarchyPath: 'Chương II > Điều 8 > Khoản 1',
              article: 'Điều 8',
              clause: 'Khoản 1',
              oldContent: '1. Doanh nghiệp nhập khẩu nộp tài liệu A khi thực hiện thủ tục hải quan.',
              newContent: '1. Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi thực hiện thủ tục hải quan.',
              topics: ['CUSTOMS_PROCEDURE', 'DOCUMENT_REQUIREMENT'],
            },
            {
              changeType: ChangeType.MODIFIED,
              hierarchyPath: 'Chương II > Điều 8 > Khoản 2',
              article: 'Điều 8',
              clause: 'Khoản 2',
              oldContent: '2. Hồ sơ được lưu trong thời hạn 2 năm.',
              newContent: '2. Hồ sơ được lưu trong thời hạn 5 năm.',
              topics: ['RECORD_RETENTION'],
            },
            {
              changeType: ChangeType.ADDED,
              hierarchyPath: 'Chương II > Điều 8 > Khoản 3',
              article: 'Điều 8',
              clause: 'Khoản 3',
              oldContent: null,
              newContent: '3. Tài liệu phải được lưu dưới dạng điện tử theo tiêu chuẩn kỹ thuật của Tổng cục Hải quan.',
              topics: ['IT_REQUIREMENT', 'DATA_REQUIREMENT'],
            },
          ],
        },
        evidences: {
          create: [
            {
              id: 'EV-001',
              documentNumber: '39/2026/TT-BTC',
              documentTitle: 'Thông tư về hồ sơ hải quan xuất nhập khẩu',
              sourceUrl: 'https://thuvienphapluat.vn/van-ban/xuat-nhap-khau/thong-tu-39-2026-tt-btc.aspx',
              hierarchyPath: 'Chương II > Điều 8 > Khoản 1',
              article: 'Điều 8',
              clause: 'Khoản 1',
              textExcerpt: 'Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi thực hiện thủ tục hải quan.',
              retrievalSource: EvidenceSource.REGULATORY_CHANGE,
              verified: true,
            },
            {
              id: 'EV-002',
              documentNumber: '39/2026/TT-BTC',
              documentTitle: 'Thông tư về hồ sơ hải quan xuất nhập khẩu',
              sourceUrl: 'https://thuvienphapluat.vn/van-ban/xuat-nhap-khau/thong-tu-39-2026-tt-btc.aspx',
              hierarchyPath: 'Chương II > Điều 8 > Khoản 2',
              article: 'Điều 8',
              clause: 'Khoản 2',
              textExcerpt: 'Hồ sơ được lưu trong thời hạn 5 năm.',
              retrievalSource: EvidenceSource.REGULATORY_CHANGE,
              verified: true,
            },
            {
              id: 'EV-003',
              documentNumber: '39/2026/TT-BTC',
              documentTitle: 'Thông tư về hồ sơ hải quan xuất nhập khẩu',
              sourceUrl: 'https://thuvienphapluat.vn/van-ban/xuat-nhap-khau/thong-tu-39-2026-tt-btc.aspx',
              hierarchyPath: 'Chương II > Điều 8 > Khoản 3',
              article: 'Điều 8',
              clause: 'Khoản 3',
              textExcerpt: 'Tài liệu phải được lưu dưới dạng điện tử theo tiêu chuẩn kỹ thuật của Tổng cục Hải quan.',
              retrievalSource: EvidenceSource.REGULATORY_CHANGE,
              verified: true,
            },
          ],
        },
      },
    });
  }

  console.log('Synthetic regulation and legal evidence seeded.');

  // 4. Seed Default Applicability Rules
  const rules = [
    {
      id: 'RULE_IMPORT_DOC_REQ',
      name: 'Importer Document Requirement Rule',
      description: 'Applies when regulatory change introduces document requirements for importing entities',
      topic: 'DOCUMENT_REQUIREMENT',
      priority: 10,
      enabled: true,
      targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
      explanationTemplate: 'Matched because organization engages in IMPORT activities and regulatory change introduces DOCUMENT_REQUIREMENT',
      conditionsJson: [
        { field: 'businessActivities', operator: 'CONTAINS', value: 'IMPORT' },
      ],
    },
    {
      id: 'RULE_RECORD_RETENTION_IMPORT',
      name: 'Record Retention Extension for Importers',
      description: 'Mandatory record retention changes apply directly to importing businesses',
      topic: 'RECORD_RETENTION',
      priority: 15,
      enabled: true,
      targetStatus: ApplicabilityStatus.APPLIES,
      explanationTemplate: 'Matched because importing organizations are legally required to retain customs records for the mandated period',
      conditionsJson: [
        { field: 'businessActivities', operator: 'CONTAINS', value: 'IMPORT' },
      ],
    },
    {
      id: 'RULE_CUSTOMS_PROCEDURE_ACTIVITY',
      name: 'Customs Procedure Applicability Rule',
      description: 'Applies when customs procedures change for organizations handling import/export declarations',
      topic: 'CUSTOMS_PROCEDURE',
      priority: 20,
      enabled: true,
      targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
      explanationTemplate: 'Matched because organization operates in international trade or customs declaration',
      conditionsJson: [
        { field: 'businessActivities', operator: 'CONTAINS', value: 'IMPORT' },
      ],
    },
    {
      id: 'RULE_ELECTRONIC_STORAGE_IT',
      name: 'Electronic Archive & Data Requirement',
      description: 'Applies to entities storing customs documentation electronically',
      topic: 'IT_REQUIREMENT',
      priority: 30,
      enabled: true,
      targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
      explanationTemplate: 'Matched because entity retains trade documents subject to electronic data and archive standards',
      conditionsJson: [
        { field: 'businessActivities', operator: 'CONTAINS', value: 'IMPORT' },
      ],
    },
    {
      id: 'RULE_NON_IMPORT_EXCLUSION',
      name: 'Consulting / Non-Trade Service Exclusion',
      description: 'Excludes organizations with purely domestic consulting activities and no import/export operations',
      priority: 100,
      enabled: true,
      targetStatus: ApplicabilityStatus.DOES_NOT_APPLY,
      explanationTemplate: 'Matched non-trade exclusion because organization only conducts CONSULTING with no customs/trade activities',
      conditionsJson: [
        { field: 'businessActivities', operator: 'CONTAINS', value: 'CONSULTING' },
        { field: 'businessActivities', operator: 'NOT_IN', value: ['IMPORT', 'EXPORT', 'CUSTOMS_DECLARATION'] },
      ],
    },
  ];

  for (const r of rules) {
    await prisma.applicabilityRule.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }

  console.log('Default applicability rules seeded.');
  console.log('ImpactLens seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
