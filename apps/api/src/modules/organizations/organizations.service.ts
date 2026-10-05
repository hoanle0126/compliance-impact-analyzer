import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, OrganizationProfile, UserRole } from '@impactlens/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    if (user.globalRole === UserRole.SYSTEM_ADMIN) {
      return this.prisma.organization.findMany({
        include: {
          activities: true,
          _count: { select: { analyses: true, facilities: true, products: true } },
        },
        orderBy: { displayName: 'asc' },
      });
    }

    const orgIds = user.memberships.map((m) => m.organizationId);
    return this.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      include: {
        activities: true,
        _count: { select: { analyses: true, facilities: true, products: true } },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        activities: true,
        facilities: true,
        products: true,
        facts: true,
        profileVersions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
      },
    });

    if (!org) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: `Organization with ID '${id}' not found.`,
      });
    }

    return org;
  }

  async getProfile(id: string): Promise<OrganizationProfile> {
    const org = await this.findOne(id);

    const isImporterFact = org.facts.find((f) => f.factType === 'CUSTOMS_PROFILE_IMPORTER');
    const isExporterFact = org.facts.find((f) => f.factType === 'CUSTOMS_PROFILE_EXPORTER');

    let isImporter: boolean | null = null;
    if (isImporterFact) {
      isImporter = Boolean(isImporterFact.valueJson);
    } else if (org.activities && org.activities.length > 0) {
      isImporter = org.activities.some((a) => a.activityType === 'IMPORT');
    }

    let isExporter: boolean | null = null;
    if (isExporterFact) {
      isExporter = Boolean(isExporterFact.valueJson);
    } else if (org.activities && org.activities.length > 0) {
      isExporter = org.activities.some((a) => a.activityType === 'EXPORT');
    }

    return {
      id: org.id,
      legalName: org.legalName,
      displayName: org.displayName,
      organizationType: org.organizationType as any,
      taxId: org.taxId || undefined,
      country: org.country,
      jurisdictions: org.jurisdictions,
      industry: org.industry,
      businessModel: org.businessModel,
      employeeRange: org.employeeRange || undefined,
      active: org.active,
      businessActivities: org.activities.map((a) => a.activityType as any),
      facilities: org.facilities.map((f) => ({
        id: f.id,
        name: f.name,
        location: f.location,
        facilityType: f.facilityType,
        customsArea: f.customsArea,
        isBonded: f.isBonded,
        processingActivity: f.processingActivity || undefined,
      })),
      products: org.products.map((p) => ({
        id: p.id,
        category: p.category,
        hsCode: p.hsCode,
        description: p.description,
        originCountries: p.originCountries,
        destinationCountries: p.destinationCountries,
        isControlled: p.isControlled,
        notes: p.notes || undefined,
      })),
      customsProfile: {
        isImporter,
        isExporter,
        isCustomsBroker: org.organizationType === 'CUSTOMS_BROKER',
        isFdi: org.organizationType === 'FDI_ENTERPRISE',
        isExportProcessingEnterprise: org.organizationType === 'EXPORT_PROCESSING_ENTERPRISE',
        isBondedWarehouseOperator: org.facilities.some((f) => f.isBonded),
        isManufacturingForExport: org.activities.some((a) => a.activityType === 'MANUFACTURING' || a.activityType === 'PROCESSING'),
        isProcessingEnterprise: org.activities.some((a) => a.activityType === 'PROCESSING'),
      },
      facts: org.facts.map((f) => ({
        id: f.id,
        factType: f.factType,
        value: f.valueJson as any,
        source: f.source as any,
        confidence: f.confidence as any,
        notes: f.notes || undefined,
      })),
      profileVersion: org.profileVersion,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto, userId: string) {
    const existingOrg = await this.findOne(id);
    const newVersionNumber = existingOrg.profileVersion + 1;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedOrg = await tx.organization.update({
        where: { id },
        data: {
          displayName: dto.displayName || existingOrg.displayName,
          organizationType: dto.organizationType || existingOrg.organizationType,
          taxId: dto.taxId !== undefined ? dto.taxId : existingOrg.taxId,
          industry: dto.industry || existingOrg.industry,
          businessModel: dto.businessModel || existingOrg.businessModel,
          profileVersion: newVersionNumber,
        },
      });

      // 2. Update business activities if provided
      if (dto.businessActivities) {
        await tx.businessActivity.deleteMany({ where: { organizationId: id } });
        if (dto.businessActivities.length > 0) {
          await tx.businessActivity.createMany({
            data: dto.businessActivities.map((act) => ({
              organizationId: id,
              activityType: act as any,
            })),
          });
        }
      }

      // 3. Update facts if provided
      if (dto.facts) {
        for (const fact of dto.facts) {
          const existingFact = await tx.profileFact.findFirst({
            where: { organizationId: id, factType: fact.factType },
          });
          if (existingFact) {
            await tx.profileFact.update({
              where: { id: existingFact.id },
              data: {
                valueJson: fact.value,
                source: (fact.source as any) || existingFact.source,
                confidence: (fact.confidence as any) || existingFact.confidence,
                notes: fact.notes !== undefined ? fact.notes : existingFact.notes,
              },
            });
          } else {
            await tx.profileFact.create({
              data: {
                organizationId: id,
                factType: fact.factType,
                valueJson: fact.value,
                source: (fact.source as any) || 'USER_PROVIDED',
                confidence: (fact.confidence as any) || 'VERIFIED',
                notes: fact.notes,
              },
            });
          }
        }
      }

      // 4. Create historical version snapshot
      const snapshot = {
        organizationId: id,
        legalName: updatedOrg.legalName,
        displayName: updatedOrg.displayName,
        organizationType: updatedOrg.organizationType,
        profileVersion: newVersionNumber,
        businessActivities: dto.businessActivities || existingOrg.activities.map((a) => a.activityType),
        timestamp: new Date().toISOString(),
      };

      await tx.organizationProfileVersion.create({
        data: {
          organizationId: id,
          versionNumber: newVersionNumber,
          profileSnapshot: snapshot,
          changeReason: dto.changeReason || `Profile updated to version ${newVersionNumber}`,
          createdByUserId: userId,
        },
      });

      return updatedOrg;
    });

    return this.getProfile(result.id);
  }

  async getProfileVersions(organizationId: string) {
    return this.prisma.organizationProfileVersion.findMany({
      where: { organizationId },
      orderBy: { versionNumber: 'desc' },
    });
  }
}
