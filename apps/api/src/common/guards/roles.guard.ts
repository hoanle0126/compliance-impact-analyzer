import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@impactlens/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Access denied: user context missing',
      });
    }

    // SYSTEM_ADMIN has access to everything
    if (user.globalRole === UserRole.SYSTEM_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.globalRole);
    if (!hasRole) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
        message: `Action requires one of the following roles: [${requiredRoles.join(', ')}]. Current role: ${user.globalRole}`,
      });
    }

    return true;
  }
}
