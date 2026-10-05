import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysesService } from './analyses.service';
import {
  RunAnalysisDto,
  ReviewSubmissionDto,
  AddCommentDto,
  UpdateActionDto,
} from './dto/run-analysis.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@impactlens/shared';

@ApiTags('Impact Analyses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get()
  @ApiOperation({ summary: 'List impact analyses with tenant isolation' })
  @ApiResponse({ status: 200, description: 'List of authorized impact analyses' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string
  ) {
    return this.analysesService.findAll(user, { organizationId, status });
  }

  @Post()
  @ApiOperation({ summary: 'Run or re-evaluate compliance impact analysis' })
  @ApiResponse({ status: 201, description: 'Analysis generated and persisted' })
  async runAnalysis(@Body() dto: RunAnalysisDto, @CurrentUser() user: AuthUser) {
    return this.analysesService.runAnalysis(dto, user);
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'List auditable compliance history logs' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLogs(@CurrentUser() user: AuthUser) {
    return this.analysesService.getAuditLogs(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complete impact analysis with areas, obligations, actions, and trace' })
  @ApiResponse({ status: 200, description: 'Full analysis report' })
  @ApiResponse({ status: 403, description: 'Forbidden: Tenant mismatch' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async findOne(@Param('id') id: string) {
    return this.analysesService.findOne(id);
  }

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Submit analysis into human compliance review queue' })
  @ApiResponse({ status: 200, description: 'Status updated to NEEDS_REVIEW' })
  async submitReview(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.analysesService.submitReview(id, user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.REVIEWER)
  @ApiOperation({ summary: 'Approve analysis findings and compliance actions' })
  @ApiResponse({ status: 200, description: 'Analysis approved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires REVIEWER or COMPLIANCE_MANAGER' })
  async approveAnalysis(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.analysesService.approveAnalysis(id, dto, user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.REVIEWER)
  @ApiOperation({ summary: 'Reject analysis findings' })
  @ApiResponse({ status: 200, description: 'Analysis rejected' })
  async rejectAnalysis(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.analysesService.rejectAnalysis(id, dto, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add compliance reviewer commentary' })
  @ApiResponse({ status: 201, description: 'Comment logged' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.analysesService.addComment(id, dto, user);
  }
}

@ApiTags('Actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('actions')
export class ActionsController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update status or owner of recommended compliance action' })
  @ApiResponse({ status: 200, description: 'Action updated' })
  async updateAction(
    @Param('id') id: string,
    @Body() dto: UpdateActionDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.analysesService.updateAction(id, dto, user);
  }
}
