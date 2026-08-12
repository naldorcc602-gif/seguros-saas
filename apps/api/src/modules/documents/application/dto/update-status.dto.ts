// @ts-nocheck
import { IsIn } from 'class-validator';

const STATUSES = ['PENDING', 'RECEIVED', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'];

export class UpdateDocumentStatusDto {
  @IsIn(STATUSES)
  status!: string;
}

export class UpdateChecklistItemStatusDto {
  @IsIn(STATUSES)
  status!: string;
}

