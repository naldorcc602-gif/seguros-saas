// @ts-nocheck
import { IsString, MinLength } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsString()
  @MinLength(1)
  subject!: string;

  @IsString()
  @MinLength(1)
  bodyHtml!: string;
}

export class PreviewEmailTemplateDto {
  @IsString()
  subject!: string;

  @IsString()
  bodyHtml!: string;
}

