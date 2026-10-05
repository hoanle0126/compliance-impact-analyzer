import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { UserRole, OrganizationType } from '@impactlens/shared';
import * as bcrypt from 'bcryptjs';

describe('Auth & Tenant Isolation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analystToken: string;
  let viewerToken: string;
  let isolatedUserToken: string;
  let isolatedOrgId: string;
  let demoMfgOrgId: string;

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

    // Fetch demo mfg org
    const demoMfg = await prisma.organization.findFirst({
      where: { legalName: 'DEMO IMPORT MANUFACTURING CO.' },
    });
    demoMfgOrgId = demoMfg!.id;

    // Login analyst
    const analystRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'analyst@impactlens.local', password: 'Password123!' });
    analystToken = analystRes.body.accessToken;

    // Login viewer
    const viewerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'viewer@impactlens.local', password: 'Password123!' });
    viewerToken = viewerRes.body.accessToken;

    // Create an isolated organization and user with NO access to demoMfg
    const isolatedOrg = await prisma.organization.create({
      data: {
        legalName: 'TENANT_B_ISOLATED_CORP',
        displayName: 'Isolated Tenant B',
        organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
        industry: 'Secret Tech',
        businessModel: 'B2B',
      },
    });
    isolatedOrgId = isolatedOrg.id;

    const isolatedUser = await prisma.user.create({
      data: {
        email: `isolated_user_${Date.now()}@tenantb.local`,
        fullName: 'Tenant B User',
        passwordHash: await bcrypt.hash('Password123!', 10),
        globalRole: UserRole.ANALYST,
        memberships: {
          create: {
            organizationId: isolatedOrg.id,
            role: UserRole.ANALYST,
          },
        },
      },
    });

    const isolatedLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: isolatedUser.email, password: 'Password123!' });
    isolatedUserToken = isolatedLoginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup isolated test records
    await prisma.organization.deleteMany({ where: { legalName: 'TENANT_B_ISOLATED_CORP' } });
    await prisma.user.deleteMany({ where: { email: { contains: 'isolated_user_' } } });
    await app.close();
  });

  it('authenticates valid user and returns JWT token and user profile', async () => {
    expect(analystToken).toBeDefined();
    expect(typeof analystToken).toBe('string');
  });

  it('rejects invalid password with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'analyst@impactlens.local', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('retrieves /api/auth/me profile with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('analyst@impactlens.local');
    expect(res.body.globalRole).toBe(UserRole.ANALYST);
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/organizations');
    expect(res.status).toBe(401);
  });

  it('IDOR SECURITY: Prevents User from Tenant B from accessing Tenant A profile', async () => {
    // Isolated user attempts to retrieve Demo Mfg profile
    const res = await request(app.getHttpServer())
      .get(`/api/organizations/${demoMfgOrgId}/profile`)
      .set('Authorization', `Bearer ${isolatedUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('UNAUTHORIZED_ORGANIZATION');
  });

  it('ROLE SECURITY: Blocks VIEWER role from approving an analysis', async () => {
    // Viewer attempts to call approve
    const res = await request(app.getHttpServer())
      .post('/api/analyses/any-fake-id/approve')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ comments: 'Illegal viewer approval' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_ROLE_PERMISSIONS');
  });

  it('ROLE SECURITY: Blocks ANALYST role from deleting applicability rules', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/rules/RULE_IMPORT_DOC_REQ')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_ROLE_PERMISSIONS');
  });
});
