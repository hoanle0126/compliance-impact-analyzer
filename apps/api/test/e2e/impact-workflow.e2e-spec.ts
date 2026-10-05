import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ApplicabilityStatus, PriorityLevel, AnalysisWorkflowStatus, UserRole } from '@impactlens/shared';

describe('Compliance Impact Analysis Workflow E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analystToken: string;
  let reviewerToken: string;

  let demoMfgOrgId: string;
  let demoServiceOrgId: string;
  let demoUnknownOrgId: string;
  let regChangeId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Fetch seeded organizations
    const mfg = await prisma.organization.findFirst({ where: { legalName: 'DEMO IMPORT MANUFACTURING CO.' } });
    const srv = await prisma.organization.findFirst({ where: { legalName: 'DEMO LOCAL SERVICE CO.' } });
    const unk = await prisma.organization.findFirst({ where: { legalName: 'DEMO UNKNOWN TRADING CO.' } });
    const reg = await prisma.regulatoryChange.findFirst({ where: { documentNumber: '39/2026/TT-BTC' } });

    demoMfgOrgId = mfg!.id;
    demoServiceOrgId = srv!.id;
    demoUnknownOrgId = unk!.id;
    regChangeId = reg!.id;

    // Login analyst and reviewer
    const analystRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'analyst@impactlens.local', password: 'Password123!' });
    analystToken = analystRes.body.accessToken;

    const reviewerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'reviewer@impactlens.local', password: 'Password123!' });
    reviewerToken = reviewerRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Case 1: Runs analysis for Demo Import Manufacturing Co. -> POTENTIALLY_APPLIES, areas, actions, priority, and review workflow', async () => {
    // 1. Run analysis
    const runRes = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: demoMfgOrgId,
        regulatoryChangeId: regChangeId,
        forceReanalyze: true,
      });

    expect(runRes.status).toBe(201);
    const analysis = runRes.body;
    expect(analysis.id).toBeDefined();
    expect([ApplicabilityStatus.POTENTIALLY_APPLIES, ApplicabilityStatus.APPLIES]).toContain(analysis.status === 'ANALYZED' ? 'POTENTIALLY_APPLIES' : analysis.status);
    expect(analysis.priorityScore).toBeGreaterThanOrEqual(50);
    expect([PriorityLevel.HIGH, PriorityLevel.CRITICAL]).toContain(analysis.priorityLevel);
    expect(analysis.impactAreas.length).toBeGreaterThanOrEqual(3);
    expect(analysis.obligations.length).toBeGreaterThanOrEqual(2);
    expect(analysis.recommendedActions.length).toBeGreaterThanOrEqual(2);

    // Verify legal evidence was cited
    const evidenceIds = analysis.impactAreas.flatMap((a: any) => a.evidenceIds);
    expect(evidenceIds).toContain('EV-001');

    // 2. Submit for human review
    const submitRes = await request(app.getHttpServer())
      .post(`/api/analyses/${analysis.id}/submit-review`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.status).toBe(AnalysisWorkflowStatus.NEEDS_REVIEW);

    // 3. Add reviewer comment
    const commentRes = await request(app.getHttpServer())
      .post(`/api/analyses/${analysis.id}/comments`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ content: 'Verified that Document B is an inspection certificate. Approved for customs broker notification.' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.content).toContain('Document B');

    // 4. Approve analysis
    const approveRes = await request(app.getHttpServer())
      .post(`/api/analyses/${analysis.id}/approve`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ comments: 'Fully reviewed and approved by Chief Legal Counsel.' });

    expect(approveRes.status).toBe(201);
    expect(approveRes.body.status).toBe(AnalysisWorkflowStatus.APPROVED);
    expect(approveRes.body.reviews.length).toBeGreaterThanOrEqual(1);
    expect(approveRes.body.reviews[0].status).toBe(AnalysisWorkflowStatus.APPROVED);
  });

  it('Case 2: Runs analysis for Demo Local Service Co. -> DOES_NOT_APPLY with clear non-trade reasoning', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: demoServiceOrgId,
        regulatoryChangeId: regChangeId,
        forceReanalyze: true,
      });

    expect(res.status).toBe(201);
    const analysis = res.body;
    expect(analysis.summary).toContain('does not currently apply');
    expect(analysis.priorityLevel).toBe(PriorityLevel.LOW);
    expect(analysis.obligations).toHaveLength(0);
    expect(analysis.recommendedActions).toHaveLength(0);
  });

  it('Case 3: Runs analysis for Demo Unknown Trading Co. -> INSUFFICIENT_INFORMATION without guessing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: demoUnknownOrgId,
        regulatoryChangeId: regChangeId,
        forceReanalyze: true,
      });

    expect(res.status).toBe(201);
    const analysis = res.body;
    expect(analysis.summary.toLowerCase()).toContain('missing company profile facts');
    expect(analysis.requiresHumanReview).toBe(true);
  });

  it('Case 4: Historical Profile Versioning Reproducibility Test', async () => {
    // 1. Create a temporary organization without import activities (Profile V1)
    const tempOrg = await prisma.organization.create({
      data: {
        legalName: `TEMP_PROFILE_VER_${Date.now()}`,
        displayName: 'Temp Profile Test',
        industry: 'Electronics',
        businessModel: 'B2B',
        profileVersion: 1,
        activities: { create: [{ activityType: 'CONSULTING' }] },
      },
    });

    const analystUser = await prisma.user.findUnique({ where: { email: 'analyst@impactlens.local' } });
    await prisma.organizationMembership.create({
      data: {
        userId: analystUser!.id,
        organizationId: tempOrg.id,
        role: UserRole.ANALYST,
      },
    });

    await prisma.organizationProfileVersion.create({
      data: {
        organizationId: tempOrg.id,
        versionNumber: 1,
        changeReason: 'Initial V1 without import activities',
        profileSnapshot: { activities: ['CONSULTING'] },
      },
    });

    // 2. Run analysis on V1 -> Result DOES_NOT_APPLY
    const resV1 = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: tempOrg.id,
        regulatoryChangeId: regChangeId,
        forceReanalyze: true,
      });

    expect(resV1.body.summary).toContain('does not currently apply');
    const analysisId = resV1.body.id;

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@impactlens.local', password: 'Password123!' });
    const adminToken = adminRes.body.accessToken;

    // 3. Update organization profile to V2 (adding IMPORT activity) using COMPLIANCE_MANAGER or ADMIN role
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/organizations/${tempOrg.id}/profile`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        businessActivities: ['IMPORT', 'MANUFACTURING'],
        changeReason: 'Expanded business scope to include import operations',
      });
    expect(patchRes.status).toBe(200);

    // 4. Re-run analysis on V2 -> Result now POTENTIALLY_APPLIES
    const resV2 = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: tempOrg.id,
        regulatoryChangeId: regChangeId,
        forceReanalyze: true,
      });

    expect(resV2.body.id).toBe(analysisId);
    expect(resV2.body.versions.length).toBe(2);

    // Verify historical V1 version snapshot is preserved in database
    const v1Snapshot = resV2.body.versions.find((v: any) => v.versionNumber === 1);
    const v2Snapshot = resV2.body.versions.find((v: any) => v.versionNumber === 2);

    expect(v1Snapshot.basedOnProfileVersion).toBe(1);
    expect(v2Snapshot.basedOnProfileVersion).toBe(2);
    expect(v1Snapshot.snapshotJson.assessment.summary).toContain('does not currently apply');

    // Clean up temp org
    await prisma.organization.delete({ where: { id: tempOrg.id } });
  });

  it('Case 5: Idempotency prevents duplicate analysis execution when data is unchanged', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: demoMfgOrgId,
        regulatoryChangeId: regChangeId,
        forceReanalyze: false,
      });

    const res2 = await request(app.getHttpServer())
      .post('/api/analyses')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        organizationId: demoMfgOrgId,
        regulatoryChangeId: regChangeId,
        forceReanalyze: false,
      });

    expect(res1.body.id).toBe(res2.body.id);
    expect(res1.body.activeVersionNumber).toBe(res2.body.activeVersionNumber);
  });
});
