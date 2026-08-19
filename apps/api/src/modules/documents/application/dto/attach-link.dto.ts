// @ts-nocheck
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class AttachLinkDto {
  @IsUrl({}, { message: 'Informe uma URL válida.' })
  url!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  checklistItemId?: string;
}
