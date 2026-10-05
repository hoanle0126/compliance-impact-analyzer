import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe verifying API process is alive' })
  @ApiResponse({ status: 200, description: 'API alive' })
  getLiveness() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'impactlens-api',
      version: '1.0.0',
    };
  }
}

@ApiTags('Health')
@Controller('readiness')
export class ReadinessController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Readiness probe inspecting PostgreSQL, Redis and external integrations' })
  @ApiResponse({ status: 200, description: 'Services ready' })
  @ApiResponse({ status: 503, description: 'Core dependencies unavailable' })
  async getReadiness(@Res() res: Response) {
    let dbStatus = 'DOWN';
    let redisStatus = 'DOWN';
    let overallReady = true;

    // Check Postgres
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'UP';
    } catch (e: any) {
      dbStatus = `DOWN: ${e.message}`;
      overallReady = false;
    }

    // Check Redis
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6383,
        password: process.env.REDIS_PASSWORD || undefined,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      });
      const pingRes = await redis.ping();
      if (pingRes === 'PONG') {
        redisStatus = 'UP';
      }
      await redis.quit();
    } catch (e: any) {
      redisStatus = `DOWN: ${e.message}`;
      overallReady = false;
    }

    // Optional Legal RAG status
    const legalRagStatus = process.env.LEGAL_RAG_API_URL ? 'CONFIGURED' : 'NOT_CONFIGURED';

    const statusCode = overallReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json({
      status: overallReady ? 'READY' : 'DEGRADED',
      components: {
        database: { status: dbStatus },
        redis: { status: redisStatus },
        legalRag: { status: legalRagStatus },
      },
      timestamp: new Date().toISOString(),
    });
  }
}
