import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class ConfirmUploadDto {
  @IsString()
  storageKey!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @IsPositive()
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  checklistItemId?: string;

  @IsOptional()
  @IsString()
  geoLocation?: string;
}
