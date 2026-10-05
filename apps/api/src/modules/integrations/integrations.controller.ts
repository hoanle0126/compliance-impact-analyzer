import { Controller, Post, Body, Headers, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { Request } from 'express';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('regulatory-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for RegTracker regulatory change ingestion' })
  @ApiHeader({ name: 'X-Signature-SHA256', required: false, description: 'HMAC SHA256 payload signature' })
  @ApiResponse({ status: 200, description: 'Regulatory change ingested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid changeset payload' })
  @ApiResponse({ status: 401, description: 'Invalid HMAC signature' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature-sha256') signature: string,
    @Req() req: Request
  ) {
    const rawPayload = JSON.stringify(body);
    return this.integrationsService.handleRegulatoryChangeWebhook(body, rawPayload, signature);
  }

  @Post('legal-rag/test')
  @ApiOperation({ summary: 'Test external Legal RAG integration connectivity' })
  async testLegalRag(@Body() body: { query: string; documentNumber?: string }) {
    return this.integrationsService.queryLegalRagEvidence(body.query || 'hồ sơ hải quan', body.documentNumber);
  }
}
