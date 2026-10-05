import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { RegulatoryChangesService } from '../regulatory-changes/regulatory-changes.service';
import { RulesService } from '../rules/rules.service';
import { AiService } from '../ai/ai.service';
import { ApplicabilityEngine } from '@impactlens/applicability-engine';
import { ImpactEngine } from '@impactlens/impact-engine';
import {
  RunAnalysisDto,
  ReviewSubmissionDto,
  AddCommentDto,
  UpdateActionDto,
} from './dto/run-analysis.dto';
import {
  AnalysisWorkflowStatus,
  AuthUser,
  LegalEvidenceItem,
  UserRole,
} from '@impactlens/shared';

@Injectable()
export class AnalysesService {
  private readonly logger = new Logger(AnalysesService.name);

  constructor(
    private prisma: PrismaService,
    private orgsService: OrganizationsService,
    private regService: RegulatoryChangesService,
    private rulesService: RulesService,
    private aiService: AiService
  ) {}

  async findAll(user: AuthUser, query?: { organizationId?: string; status?: string }) {
    const where: any = {};

    if (user.globalRole !== UserRole.SYSTEM_ADMIN) {
      const allowedOrgIds = user.memberships.map((m) => m.organizationId);
      where.organizationId = { in: allowedOrgIds };
    }

    if (query?.organizationId) {
      where.organizationId = query.organizationId;
    }
    if (query?.status) {
      where.status = query.status;
    }

    const analyses = await this.prisma.impactAnalysis.findMany({
      where,
      include: {
        organization: { select: { id: true, legalName: true, displayName: true, organizationType: true } },
        regulatoryChange: { select: { id: true, title: true, documentNumber: true, effectiveAt: true, authority: true } },
        impactAreas: true,
        versions: { take: 1, orderBy: { versionNumber: 'desc' } },
        _count: { select: { obligations: true, recommendedActions: true, reviews: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return analyses.map((a) => {
      const latestSnapshot = a.versions?.[0]?.snapshotJson as any;
      return {
        ...a,
        applicabilityStatus: latestSnapshot?.applicability?.status || 'POTENTIALLY_APPLIES',
      };
    });
  }

  async getAuditLogs(user: AuthUser) {
    const where: any = {};
    if (user.globalRole !== UserRole.SYSTEM_ADMIN) {
      const allowedOrgIds = user.memberships.map((m) => m.organizationId);
      where.organizationId = { in: allowedOrgIds };
    }
    return this.prisma.analysisAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        analysis: {
          select: {
            id: true,
            organization: { select: { displayName: true } },
            regulatoryChange: { select: { documentNumber: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const analysis = await this.prisma.impactAnalysis.findUnique({
      where: { id },
      include: {
        organization: {
          include: { activities: true, facilities: true, products: true, facts: true },
        },
        regulatoryChange: {
          include: { changes: true, evidences: true },
        },
        impactAreas: true,
        obligations: true,
        recommendedActions: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } },
        comments: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!analysis) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'ANALYSIS_NOT_FOUND',
        message: `Impact analysis with ID '${id}' not found.`,
      });
    }

    const latestVersion = analysis.versions?.[0];
    const snapshot = latestVersion?.snapshotJson as any;
    const applicabilityStatus = snapshot?.applicability?.status || 'POTENTIALLY_APPLIES';
    const applicabilityReason = snapshot?.applicability?.reasoningFactors?.join('; ') || '';
    const decisionTrace = snapshot?.assessment?.decisionTrace || [];
    const assumptions = snapshot?.assessment?.assumptions || [];
    const missingInformation = snapshot?.applicability?.missingInformation || [];

    return {
      ...analysis,
      applicabilityStatus,
      applicabilityReason,
      decisionTrace,
      assumptions,
      missingInformation,
    };
  }

  async runAnalysis(dto: RunAnalysisDto, user: AuthUser) {
    const { organizationId, regulatoryChangeId, idempotencyKey, forceReanalyze } = dto;

    // 1. Idempotency & existing analysis check
    const existing = await this.prisma.impactAnalysis.findFirst({
      where: {
        organizationId,
        regulatoryChangeId,
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    const orgProfile = await this.orgsService.getProfile(organizationId);
    const regRecord = await this.regService.findOne(regulatoryChangeId);

    if (existing && !forceReanalyze) {
      const latestVersion = existing.versions[0];
      if (latestVersion && latestVersion.basedOnProfileVersion === orgProfile.profileVersion) {
        this.logger.log(`Idempotent hit: Returning existing analysis ${existing.id} for Org ${organizationId} and Reg ${regulatoryChangeId}`);
        return this.findOne(existing.id);
      }
    }

    // 2. Prepare Engines & Data
    const changePayload = this.regService.toPayload(regRecord);
    const ruleDefs = await this.rulesService.getEngineRules();
    const applicabilityEngine = new ApplicabilityEngine(ruleDefs);

    const legalEvidences: LegalEvidenceItem[] = regRecord.evidences.map((e) => ({
      id: e.id,
      documentNumber: e.documentNumber,
      documentTitle: e.documentTitle,
      sourceUrl: e.sourceUrl || undefined,
      hierarchyPath: e.hierarchyPath,
      article: e.article || undefined,
      clause: e.clause || undefined,
      point: e.point || undefined,
      textExcerpt: e.textExcerpt,
      retrievalSource: e.retrievalSource as any,
      verified: e.verified,
    }));

    // 3. Run Applicability Engine
    const applicabilityResult = applicabilityEngine.evaluate(
      orgProfile,
      changePayload,
      legalEvidences.map((e) => e.id)
    );

    // 4. Run Impact Engine
    const impactEngine = new ImpactEngine(this.aiService);
    const impactAssessment = await impactEngine.analyze(
      orgProfile,
      changePayload,
      applicabilityResult,
      legalEvidences
    );

    // 5. Persist inside transactional boundary
    const savedAnalysis = await this.prisma.$transaction(async (tx) => {
      let analysisRecord: any = existing;
      const nextVersionNumber = existing ? existing.activeVersionNumber + 1 : 1;

      if (!analysisRecord) {
        analysisRecord = await tx.impactAnalysis.create({
          data: {
            organizationId,
            regulatoryChangeId,
            activeVersionNumber: nextVersionNumber,
            status: AnalysisWorkflowStatus.ANALYZED,
            priorityScore: impactAssessment.priorityScore,
            priorityLevel: impactAssessment.priorityLevel as any,
            confidence: impactAssessment.applicability.confidence as any,
            summary: impactAssessment.summary,
            requiresHumanReview: impactAssessment.requiresHumanReview,
            idempotencyKey: idempotencyKey || `${organizationId}_${regulatoryChangeId}_v${nextVersionNumber}`,
          },
        });
      } else {
        // Clear previous child records for re-analysis
        await tx.impactArea.deleteMany({ where: { analysisId: analysisRecord.id } });
        await tx.complianceObligation.deleteMany({ where: { analysisId: analysisRecord.id } });
        await tx.recommendedAction.deleteMany({ where: { analysisId: analysisRecord.id } });

        analysisRecord = await tx.impactAnalysis.update({
          where: { id: analysisRecord.id },
          data: {
            activeVersionNumber: nextVersionNumber,
            status: AnalysisWorkflowStatus.ANALYZED,
            priorityScore: impactAssessment.priorityScore,
            priorityLevel: impactAssessment.priorityLevel as any,
            confidence: impactAssessment.applicability.confidence as any,
            summary: impactAssessment.summary,
            requiresHumanReview: impactAssessment.requiresHumanReview,
          },
        });
      }

      const currentAnalysisId: string = analysisRecord.id;

      // Create Impact Areas
      if (impactAssessment.impactAreas.length > 0) {
        await tx.impactArea.createMany({
          data: impactAssessment.impactAreas.map((ia) => ({
            analysisId: currentAnalysisId,
            area: ia.area as any,
            severity: ia.severity as any,
            description: ia.description,
            evidenceIds: ia.evidenceIds,
          })),
        });
      }

      // Create Compliance Obligations
      if (impactAssessment.obligations.length > 0) {
        await tx.complianceObligation.createMany({
          data: impactAssessment.obligations.map((ob) => ({
            analysisId: currentAnalysisId,
            title: ob.title,
            description: ob.description,
            obligationType: ob.obligationType as any,
            responsibleDepartment: ob.responsibleDepartment as any,
            effectiveFrom: ob.effectiveFrom ? new Date(ob.effectiveFrom) : null,
            deadline: ob.deadline ? new Date(ob.deadline) : null,
            rawDeadlineText: ob.rawDeadlineText,
            evidenceIds: ob.evidenceIds,
            confidence: ob.confidence as any,
            requiresReview: ob.requiresReview,
          })),
        });
      }

      // Create Recommended Actions
      if (impactAssessment.recommendedActions.length > 0) {
        await tx.recommendedAction.createMany({
          data: impactAssessment.recommendedActions.map((ra) => ({
            analysisId: currentAnalysisId,
            title: ra.title,
            description: ra.description,
            priority: ra.priority as any,
            ownerDepartment: ra.ownerDepartment as any,
            dueDate: ra.dueDate ? new Date(ra.dueDate) : null,
            basis: ra.basis,
            evidenceIds: ra.evidenceIds,
            status: ra.status as any,
          })),
        });
      }

      // Create Version Snapshot
      await tx.impactAnalysisVersion.create({
        data: {
          analysisId: currentAnalysisId,
          versionNumber: nextVersionNumber,
          basedOnRegulatoryVersion: regRecord.version || '1.0',
          basedOnProfileVersion: orgProfile.profileVersion,
          analysisEngineVersion: '1.0.0',
          snapshotJson: {
            assessment: impactAssessment,
            applicability: applicabilityResult,
            timestamp: new Date().toISOString(),
          } as any,
        },
      });

      // Audit Log
      await tx.analysisAuditLog.create({
        data: {
          organizationId,
          analysisId: currentAnalysisId,
          userId: user.id,
          userEmail: user.email,
          action: nextVersionNumber === 1 ? 'ANALYSIS_CREATED' : 'ANALYSIS_REANALYZED',
          detailsJson: {
            priorityScore: impactAssessment.priorityScore,
            status: analysisRecord.status,
            applicability: impactAssessment.applicability.status,
            versionNumber: nextVersionNumber,
          },
        },
      });

      return analysisRecord;
    });

    if (!savedAnalysis) {
      throw new Error('Failed to persist impact analysis.');
    }

    return this.findOne(savedAnalysis.id);
  }

  async submitReview(analysisId: string, user: AuthUser) {
    const analysis = await this.findOne(analysisId);
    await this.prisma.impactAnalysis.update({
      where: { id: analysisId },
      data: { status: AnalysisWorkflowStatus.NEEDS_REVIEW },
    });

    await this.prisma.analysisAuditLog.create({
      data: {
        organizationId: analysis.organizationId,
        analysisId,
        userId: user.id,
        userEmail: user.email,
        action: 'SUBMITTED_FOR_REVIEW',
        detailsJson: { previousStatus: analysis.status },
      },
    });

    return this.findOne(analysisId);
  }

  async approveAnalysis(analysisId: string, dto: ReviewSubmissionDto, user: AuthUser) {
    const analysis = await this.findOne(analysisId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const an = await tx.impactAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisWorkflowStatus.APPROVED,
          summary: dto.editedSummary || analysis.summary,
        },
      });

      await tx.review.create({
        data: {
          analysisId,
          reviewerId: user.id,
          status: AnalysisWorkflowStatus.APPROVED,
          comments: dto.comments || 'Approved compliance assessment.',
          severityOverride: dto.severityOverride as any,
          editedSummary: dto.editedSummary,
        },
      });

      await tx.analysisAuditLog.create({
        data: {
          organizationId: analysis.organizationId,
          analysisId,
          userId: user.id,
          userEmail: user.email,
          action: 'ANALYSIS_APPROVED',
          detailsJson: { comments: dto.comments },
        },
      });

      return an;
    });

    return this.findOne(updated.id);
  }

  async rejectAnalysis(analysisId: string, dto: ReviewSubmissionDto, user: AuthUser) {
    const analysis = await this.findOne(analysisId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const an = await tx.impactAnalysis.update({
        where: { id: analysisId },
        data: { status: AnalysisWorkflowStatus.REJECTED },
      });

      await tx.review.create({
        data: {
          analysisId,
          reviewerId: user.id,
          status: AnalysisWorkflowStatus.REJECTED,
          comments: dto.comments || 'Rejected analysis conclusions.',
          severityOverride: dto.severityOverride as any,
        },
      });

      await tx.analysisAuditLog.create({
        data: {
          organizationId: analysis.organizationId,
          analysisId,
          userId: user.id,
          userEmail: user.email,
          action: 'ANALYSIS_REJECTED',
          detailsJson: { comments: dto.comments },
        },
      });

      return an;
    });

    return this.findOne(updated.id);
  }

  async addComment(analysisId: string, dto: AddCommentDto, user: AuthUser) {
    const analysis = await this.findOne(analysisId);

    const comment = await this.prisma.reviewComment.create({
      data: {
        analysisId,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.globalRole as any,
        content: dto.content,
      },
    });

    await this.prisma.analysisAuditLog.create({
      data: {
        organizationId: analysis.organizationId,
        analysisId,
        userId: user.id,
        userEmail: user.email,
        action: 'COMMENT_ADDED',
        detailsJson: { commentId: comment.id },
      },
    });

    return comment;
  }

  async updateAction(actionId: string, dto: UpdateActionDto, user: AuthUser) {
    const action = await this.prisma.recommendedAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new NotFoundException(`Action with ID '${actionId}' not found`);
    }

    return this.prisma.recommendedAction.update({
      where: { id: actionId },
      data: {
        status: (dto.status as any) || action.status,
        ownerDepartment: (dto.ownerDepartment as any) || action.ownerDepartment,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : action.dueDate,
      },
    });
  }
}
