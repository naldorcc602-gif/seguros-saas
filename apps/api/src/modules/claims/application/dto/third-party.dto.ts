// @ts-nocheck
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ThirdPartyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

