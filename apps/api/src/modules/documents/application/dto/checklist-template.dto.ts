import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

const PRODUCT_TYPES = ['AUTO', 'CARGO', 'LIFE', 'RESIDENTIAL', 'BUSINESS', 'TRANSPORT', 'RC', 'RCTRC', 'RCDC', 'RCV'];

export class CreateChecklistTemplateDto {
  @IsIn(PRODUCT_TYPES)
  productType!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class GenerateUploadLinkDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiresInDays?: number;
}
