import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegulatoryChangesService } from './regulatory-changes.service';
import { CreateRegulatoryChangeDto } from './dto/create-regulatory-change.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@impactlens/shared';

@ApiTags('Regulatory Changes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('regulatory-changes')
export class RegulatoryChangesController {
  constructor(private readonly regService: RegulatoryChangesService) {}

  @Get()
  @ApiOperation({ summary: 'List all regulatory changes and change items' })
  @ApiResponse({ status: 200, description: 'List of regulatory changes' })
  async findAll() {
    return this.regService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of specific regulatory change with evidence and diffs' })
  @ApiResponse({ status: 200, description: 'Regulatory change details' })
  @ApiResponse({ status: 404, description: 'Regulatory change not found' })
  async findOne(@Param('id') id: string) {
    return this.regService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.ANALYST)
  @ApiOperation({ summary: 'Import or create new structured regulatory change' })
  @ApiResponse({ status: 201, description: 'Regulatory change created and evidence extracted' })
  async create(@Body() dto: CreateRegulatoryChangeDto) {
    return this.regService.create(dto);
  }
}
