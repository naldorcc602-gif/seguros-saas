import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ThirdPartyDto } from './third-party.dto';

const PRODUCT_TYPES = [
  'AUTO',
  'CARGO',
  'LIFE',
  'RESIDENTIAL',
  'BUSINESS',
  'TRANSPORT',
  'RC',
  'RCTRC',
  'RCDC',
  'RCV',
] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class CreateClaimDto {
  // ── Segurado (cria ou reaproveita um Client existente por documento) ──
  @IsString()
  @MinLength(2)
  clientName!: string;

  @IsIn(['CPF', 'CNPJ'])
  clientDocumentType!: 'CPF' | 'CNPJ';

  @IsString()
  @MinLength(5)
  clientDocument!: string;

  @IsOptional() @IsString() clientPhone?: string;
  @IsOptional() @IsString() clientWhatsapp?: string;
  @IsOptional() @IsString() clientEmail?: string;
  @IsOptional() @IsString() clientAddress?: string;
  @IsOptional() @IsString() clientCity?: string;
  @IsOptional() @IsString() clientState?: string;
  @IsOptional() @IsString() clientZipCode?: string;

  // ── Vínculos ──
  @IsOptional() @IsString() insurerId?: string;
  @IsOptional() @IsString() brokerId?: string;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsString() insurerNumber?: string;

  // ── Apólice / cobertura ──
  @IsOptional() @IsString() policyNumber?: string;
  @IsEnum(PRODUCT_TYPES) productType!: (typeof PRODUCT_TYPES)[number];
  @IsOptional() @IsString() coverage?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deductible?: number;
  @IsOptional() @IsString() insuredItem?: string;

  // ── Veículo (quando aplicável: AUTO/CARGO/TRANSPORT) ──
  @IsOptional() @IsString() vehiclePlate?: string;
  @IsOptional() @IsString() renavam?: string;
  @IsOptional() @IsString() chassis?: string;
  @IsOptional() @IsString() vehicleModel?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) vehicleYear?: number;

  // ── Ocorrência ──
  @IsOptional() @IsDateString() occurredAt?: string;
  @IsOptional() @IsString() occurredLocation?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() claimType?: string;
  @IsOptional() @IsString() cause?: string;
  @IsOptional() @IsBoolean() hasThirdParties?: boolean;

  // ── Valores / observações ──
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) estimatedValue?: number;
  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsEnum(PRIORITIES) priority?: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThirdPartyDto)
  thirdParties?: ThirdPartyDto[];
}
