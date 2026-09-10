import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class QuickCreateClaimDto {
  @IsString()
  @MinLength(2)
  clientName!: string;

  @IsIn(['CPF', 'CNPJ'])
  clientDocumentType!: 'CPF' | 'CNPJ';

  @IsString()
  @MinLength(5)
  clientDocument!: string;

  @IsEnum(['AUTO', 'CARGO', 'LIFE', 'RESIDENTIAL', 'BUSINESS', 'TRANSPORT', 'RC', 'RCTRC', 'RCDC', 'RCV'])
  productType!: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;
}
