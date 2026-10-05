import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthUser } from '@impactlens/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'impactlens_secure_jwt_secret_compliance_safety_token_2026',
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      globalRole: user.globalRole as any,
      memberships: user.memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.displayName,
        role: m.role as any,
      })),
    };
  }
}
