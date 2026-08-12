// @ts-nocheck
import { IsEnum } from 'class-validator';

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

export class MoveStageDto {
  @IsEnum(STAGES)
  stage!: (typeof STAGES)[number];
}

