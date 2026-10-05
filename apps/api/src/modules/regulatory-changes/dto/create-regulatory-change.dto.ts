import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChangeType } from '@impactlens/shared';

export class ChangeItemDto {
  @ApiProperty({ enum: ChangeType })
  @IsEnum(ChangeType)
  changeType!: ChangeType;

  @ApiProperty({ example: 'Chương II > Điều 8 > Khoản 1' })
  @IsString()
  @IsNotEmpty()
  hierarchyPath!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oldContent?: string;

  @ApiProperty({ example: '1. Doanh nghiệp nhập khẩu nộp tài liệu A và tài liệu B khi làm thủ tục hải quan.' })
  @IsString()
  @IsNotEmpty()
  newContent!: string;

  @ApiProperty({ required: false, example: 'Điều 8' })
  @IsOptional()
  @IsString()
  article?: string;

  @ApiProperty({ required: false, example: 'Khoản 1' })
  @IsOptional()
  @IsString()
  clause?: string;

  @ApiProperty({ required: false, example: 'Điểm a' })
  @IsOptional()
  @IsString()
  point?: string;

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  topics?: string[];
}

export class CreateRegulatoryChangeDto {
  @ApiProperty({ example: 'Thông tư quy định về thủ tục hải quan' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '39/2026/TT-BTC' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: 'Bộ Tài chính' })
  @IsString()
  @IsNotEmpty()
  authority!: string;

  @ApiProperty({ required: false, example: 'https://thuvienphapluat.vn/van-ban/xuat-nhap-khau/tt-39-2026.aspx' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  effectiveAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  promulgatedAt?: string;

  @ApiProperty({ required: false, default: 'VIETNAM' })
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiProperty({ type: [ChangeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeItemDto)
  changes!: ChangeItemDto[];

  @ApiProperty({ required: false, isArray: true })
  @IsOptional()
  @IsArray()
  topics?: string[];
}
