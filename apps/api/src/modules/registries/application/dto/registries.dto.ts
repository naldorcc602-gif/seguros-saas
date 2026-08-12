// @ts-nocheck
import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInsurerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
export class UpdateInsurerDto extends PartialType(CreateInsurerDto) {}

export class CreateBrokerDto extends CreateInsurerDto {}
export class UpdateBrokerDto extends PartialType(CreateBrokerDto) {}

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['CPF', 'CNPJ'])
  documentType!: 'CPF' | 'CNPJ';

  @IsString()
  @MinLength(5)
  document!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}
export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class CreateAdjusterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
export class UpdateAdjusterDto extends PartialType(CreateAdjusterDto) {}

export class CreateWorkshopDto {
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
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
export class UpdateWorkshopDto extends PartialType(CreateWorkshopDto) {}

export class CreateDispatcherDto {
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
  @IsEmail()
  email?: string;
}
export class UpdateDispatcherDto extends PartialType(CreateDispatcherDto) {}

export class CreateLawyerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  oabNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
export class UpdateLawyerDto extends PartialType(CreateLawyerDto) {}

