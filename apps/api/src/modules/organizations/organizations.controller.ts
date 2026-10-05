import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@impactlens/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations accessible to current user' })
  @ApiResponse({ status: 200, description: 'List of authorized organizations' })
  async findAll(@CurrentUser() user: AuthUser) {
    return this.orgsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details and facilities' })
  @ApiResponse({ status: 200, description: 'Organization retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden: Tenant isolation mismatch' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get normalized organization compliance profile' })
  @ApiResponse({ status: 200, description: 'Structured profile snapshot' })
  async getProfile(@Param('id') id: string) {
    return this.orgsService.getProfile(id);
  }

  @Patch(':id/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPLIANCE_MANAGER)
  @ApiOperation({ summary: 'Update organization compliance profile and create new version snapshot' })
  @ApiResponse({ status: 200, description: 'Profile updated with version snapshot' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient role permissions or tenant mismatch' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.orgsService.updateProfile(id, dto, user.id);
  }

  @Get(':id/profile/versions')
  @ApiOperation({ summary: 'List historical profile versions for reproducibility' })
  @ApiResponse({ status: 200, description: 'List of historical snapshots' })
  async getProfileVersions(@Param('id') id: string) {
    return this.orgsService.getProfileVersions(id);
  }
}
