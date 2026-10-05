import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApplicabilityStatus, RuleOperator } from '@impactlens/shared';

export class RuleConditionDto {
  @ApiProperty({ example: 'businessActivities' })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({ enum: RuleOperator })
  @IsEnum(RuleOperator)
  operator!: RuleOperator;

  @ApiProperty({ example: 'IMPORT' })
  value!: any;
}

export class CreateRuleDto {
  @ApiProperty({ example: 'RULE_CUSTOMS_BONDED_WAREHOUSE' })
  @IsString()
  @IsNotEmpty()
  id?: string;

  @ApiProperty({ example: 'Bonded Warehouse Storage Requirements' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Applies to entities operating bonded warehouse facilities' })
  @IsString()
  description!: string;

  @ApiProperty({ required: false, example: 'WAREHOUSING' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ default: 100 })
  @IsInt()
  priority!: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ type: [RuleConditionDto] })
  @IsArray()
  conditions!: RuleConditionDto[];

  @ApiProperty({ enum: ApplicabilityStatus })
  @IsEnum(ApplicabilityStatus)
  targetStatus!: ApplicabilityStatus;

  @ApiProperty({ example: 'Matched because company operates bonded warehouse storage facilities' })
  @IsString()
  @IsNotEmpty()
  explanationTemplate!: string;
}
