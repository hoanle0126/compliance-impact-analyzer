import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RunAnalysisDto {
  @ApiProperty({ example: 'org-id-here', description: 'Target client organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: 'reg-change-id-here', description: 'Regulatory change ID to evaluate' })
  @IsString()
  @IsNotEmpty()
  regulatoryChangeId!: string;

  @ApiProperty({ required: false, example: 'idem-key-123' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  forceReanalyze?: boolean;
}

export class ReviewSubmissionDto {
  @ApiProperty({ example: 'Reviewed and approved compliance actions with customs brokerage department.' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ required: false, example: 'HIGH' })
  @IsOptional()
  @IsString()
  severityOverride?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  editedSummary?: string;
}

export class AddCommentDto {
  @ApiProperty({ example: 'Please confirm whether Document B requires apostille certification.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateActionDto {
  @ApiProperty({ required: false, example: 'IN_PROGRESS' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'CUSTOMS' })
  @IsOptional()
  @IsString()
  ownerDepartment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dueDate?: string;
}
