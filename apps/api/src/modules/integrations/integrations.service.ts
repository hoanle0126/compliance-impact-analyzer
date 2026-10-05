import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegulatoryChangesService } from '../regulatory-changes/regulatory-changes.service';
import { WebhookRegulatoryChangeSchema } from '@impactlens/shared';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private prisma: PrismaService,
    private regService: RegulatoryChangesService
  ) {}

  verifyHmacSignature(rawPayload: string, signatureHeader?: string): boolean {
    const secret = process.env.REGTRACKER_WEBHOOK_SECRET;
    if (!secret) {
      // If no secret configured in environment, permit in development/test mode
      return true;
    }

    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Signature-SHA256 webhook header.');
    }

    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(rawPayload).digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader.replace('sha256=', ''), 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid webhook HMAC signature.');
    }

    return true;
  }

  async handleRegulatoryChangeWebhook(body: any, rawPayload: string, signature?: string) {
    this.verifyHmacSignature(rawPayload, signature);

    // Validate payload structure using shared Zod schema
    const parseResult = WebhookRegulatoryChangeSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'INVALID_CHANGESET',
        message: 'Webhook payload failed schema validation.',
        details: parseResult.error.format(),
      });
    }

    const data = parseResult.data;

    // Check if change already ingested
    let regChange = await this.prisma.regulatoryChange.findFirst({
      where: { documentNumber: data.document.documentNumber },
    });

    if (!regChange) {
      const created = await this.regService.create({
        title: data.document.title,
        documentNumber: data.document.documentNumber,
        authority: data.document.authority,
        sourceUrl: data.document.sourceUrl || undefined,
        effectiveAt: data.document.effectiveAt,
        promulgatedAt: data.document.promulgatedAt,
        jurisdiction: data.document.jurisdiction,
        changes: data.changes as any,
        topics: data.topics as any,
      });
      if (!created) {
        throw new Error('Failed to create regulatory change.');
      }
      regChange = created;
      this.logger.log(`Ingested regulatory change from RegTracker: ${created.documentNumber} (${created.id})`);
    } else {
      this.logger.log(`Regulatory change ${data.document.documentNumber} already exists. Ingestion acknowledged.`);
    }

    if (!regChange) {
      throw new Error('Failed to find or ingest regulatory change.');
    }

    // Identify active organizations potentially impacted
    const activeOrgs = await this.prisma.organization.findMany({
      where: { active: true },
      select: { id: true, legalName: true, displayName: true },
    });

    return {
      status: 'RECEIVED',
      regulatoryChangeId: regChange.id,
      documentNumber: regChange.documentNumber,
      effectiveAt: regChange.effectiveAt,
      candidateOrganizationsCount: activeOrgs.length,
      candidateOrganizations: activeOrgs,
    };
  }

  async queryLegalRagEvidence(query: string, documentNumber?: string): Promise<{ available: boolean; passages: any[] }> {
    const ragUrl = process.env.LEGAL_RAG_API_URL;
    const apiKey = process.env.LEGAL_RAG_API_KEY;

    if (!ragUrl) {
      return { available: false, passages: [] };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.LEGAL_RAG_TIMEOUT_MS) || 4000);

    try {
      const response = await fetch(`${ragUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          query,
          documentNumber,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`External Legal RAG responded with status ${response.status}`);
        return { available: false, passages: [] };
      }

      const data: any = await response.json();
      return { available: true, passages: data.passages || [] };
    } catch (err: any) {
      this.logger.warn(`External Legal RAG unavailable: ${err.message}. Proceeding gracefully with local evidence.`);
      return { available: false, passages: [] };
    } finally {
      clearTimeout(timeout);
    }
  }
}
