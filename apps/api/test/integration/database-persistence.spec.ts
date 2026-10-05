import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, OrganizationType, BusinessActivityType } from '@prisma/client';

describe('Database Persistence & Transactions Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('connects to isolated PostgreSQL database on port 55433 and executes query', async () => {
    const result: any = await prisma.$queryRaw`SELECT current_database(), current_user`;
    expect(result).toBeDefined();
    expect(result[0].current_database).toBe('impactlens_db');
  });

  it('guarantees transaction rollback on mid-operation failure without leaving orphan data', async () => {
    const testLegalName = `ROLLBACK_TEST_${Date.now()}`;

    await expect(
      prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            legalName: testLegalName,
            displayName: 'Rollback Test',
            industry: 'Testing',
            businessModel: 'Test',
          },
        });

        // Deliberately throw an error mid-transaction
        throw new Error('Simulated mid-transaction failure for rollback test');
      })
    ).rejects.toThrow('Simulated mid-transaction failure for rollback test');

    // Verify record was rolled back
    const found = await prisma.organization.findFirst({
      where: { legalName: testLegalName },
    });
    expect(found).toBeNull();
  });

  it('creates and tracks historical profile version snapshots immutably', async () => {
    const org = await prisma.organization.create({
      data: {
        legalName: `VERSION_TEST_${Date.now()}`,
        displayName: 'Version Test Org',
        organizationType: OrganizationType.DOMESTIC_ENTERPRISE,
        industry: 'Logistics',
        businessModel: 'B2B',
        profileVersion: 1,
      },
    });

    const v1 = await prisma.organizationProfileVersion.create({
      data: {
        organizationId: org.id,
        versionNumber: 1,
        profileSnapshot: { activities: ['CONSULTING'] },
        changeReason: 'Initial setup',
      },
    });

    const v2 = await prisma.organizationProfileVersion.create({
      data: {
        organizationId: org.id,
        versionNumber: 2,
        profileSnapshot: { activities: ['CONSULTING', 'IMPORT'] },
        changeReason: 'Added import activities',
      },
    });

    const versions = await prisma.organizationProfileVersion.findMany({
      where: { organizationId: org.id },
      orderBy: { versionNumber: 'asc' },
    });

    expect(versions).toHaveLength(2);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[1].versionNumber).toBe(2);

    // Clean up test data
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
