// @ts-nocheck
import { IsEnum, IsOptional, IsString } from 'class-validator';

const AI_ACTIONS = [
  'summary',
  'missing_documents',
  'inconsistencies',
  'next_steps',
  'email_draft',
  'technical_opinion',
  'ask',
  'history_summary',
] as const;

export class AiRequestDto {
  @IsEnum(AI_ACTIONS)
  action!: (typeof AI_ACTIONS)[number];

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  emailPurpose?: string;
}

