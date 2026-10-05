import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@impactlens/shared';

@ApiTags('Applicability Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all applicability rules' })
  async findAll() {
    return this.rulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific applicability rule' })
  async findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER)
  @ApiOperation({ summary: 'Create new applicability rule' })
  async create(@Body() dto: CreateRuleDto) {
    return this.rulesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER)
  @ApiOperation({ summary: 'Update applicability rule' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    return this.rulesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Delete applicability rule' })
  async remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }
}
