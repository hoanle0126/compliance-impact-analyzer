import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@impactlens/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'User authentication required for tenant verification',
      });
    }

    // SYSTEM_ADMIN bypasses tenant check
    if (user.globalRole === UserRole.SYSTEM_ADMIN) {
      return true;
    }

    // Determine target organizationId from params, query, or body
    let targetOrgId =
      request.params?.organizationId ||
      request.query?.organizationId ||
      request.body?.organizationId;

    // In routes like /api/organizations/:id, the param is named 'id'
    const routePath = request.route?.path || '';
    if (!targetOrgId && routePath.includes('organizations/:id') && request.params?.id) {
      targetOrgId = request.params.id;
    }

    // In routes like /api/analyses/:id, find the organizationId belonging to the analysis
    if (!targetOrgId && routePath.includes('analyses/:id') && request.params?.id) {
      const analysis = await this.prisma.impactAnalysis.findUnique({
        where: { id: request.params.id },
        select: { organizationId: true },
      });
      if (analysis) {
        targetOrgId = analysis.organizationId;
      }
    }

    if (!targetOrgId) {
      // If endpoint is not tenant-specific, permit
      return true;
    }

    // Check membership
    const hasMembership = user.memberships?.some(
      (m: any) => m.organizationId === targetOrgId
    );

    if (!hasMembership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'UNAUTHORIZED_ORGANIZATION',
        message: 'Cross-tenant access prohibited: you do not have permission to access this organization data.',
      });
    }

    return true;
  }
}
