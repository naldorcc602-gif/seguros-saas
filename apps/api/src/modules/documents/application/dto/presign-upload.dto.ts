import { IsIn, IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'image/heic',
  'image/bmp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
  'video/mp4',
  'video/quicktime',
];

const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

export class PresignUploadDto {
  @IsString()
  fileName!: string;

  @IsIn(ACCEPTED_MIME_TYPES)
  mimeType!: string;

  @IsInt()
  @IsPositive()
  @Max(MAX_UPLOAD_SIZE_BYTES)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  checklistItemId?: string;
}
