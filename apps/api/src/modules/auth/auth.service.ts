import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { AuthUser } from '@impactlens/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            organization: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const authUser: AuthUser = {
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

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      globalRole: user.globalRole,
    };

    const accessToken = this.jwtService.sign(tokenPayload);

    return {
      accessToken,
      user: authUser,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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
