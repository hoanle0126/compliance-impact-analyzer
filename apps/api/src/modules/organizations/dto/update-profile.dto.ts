import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BusinessActivityType, OrganizationType } from '@impactlens/shared';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ enum: OrganizationType, required: false })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessModel?: string;

  @ApiProperty({ enum: BusinessActivityType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  businessActivities?: BusinessActivityType[];

  @ApiProperty({ required: false })
  @IsOptional()
  customsProfile?: {
    isImporter?: boolean | null;
    isExporter?: boolean | null;
    isCustomsBroker?: boolean;
    isFdi?: boolean;
    isExportProcessingEnterprise?: boolean;
    isBondedWarehouseOperator?: boolean;
    isManufacturingForExport?: boolean;
    isProcessingEnterprise?: boolean;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  facts?: Array<{
    factType: string;
    value: any;
    source?: string;
    confidence?: string;
    notes?: string;
  }>;

  @ApiProperty({ example: 'Added IMPORT activity to corporate business license', required: false })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
