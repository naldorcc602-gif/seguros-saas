import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const STAGES = [
  'NEW',
  'INITIAL_CONTACT',
  'DOCS_PENDING',
  'DOCS_RECEIVED',
  'ANALYSIS',
  'INSPECTION',
  'ADJUSTMENT',
  'INSURER',
  'PAYMENT',
  'COMPLETED',
  'DENIED',
] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class ListClaimsQueryDto {
  @IsOptional() @IsEnum(STAGES) stage?: (typeof STAGES)[number];
  @IsOptional() @IsEnum(PRIORITIES) priority?: (typeof PRIORITIES)[number];
  @IsOptional() @IsString() insurerId?: string;
  @IsOptional() @IsString() brokerId?: string;
  @IsOptional() @IsString() search?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number = 20;
}
