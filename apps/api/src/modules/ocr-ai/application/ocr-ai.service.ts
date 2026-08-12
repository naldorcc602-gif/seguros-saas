// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { prisma } from '@seguros/database';
import type { AiResponse } from '@seguros/schemas';

import { ClaimNotFoundForAiError, MissingEmailPurposeError, MissingQuestionError } from '../domain/ocr-ai.errors';
import { AiContextRepository } from '../infrastructure/ai-context.repository';
import { AnthropicClientService } from '../infrastructure/anthropic-client.service';
import { AiRequestDto } from './dto';
import {
  buildAskPrompt,
  buildEmailDraftPrompt,
  buildHistorySummaryPrompt,
  buildInconsistenciesPrompt,
  buildMissingDocumentsPrompt,
  buildNextStepsPrompt,
  buildSummaryPrompt,
  buildTechnicalOpinionPrompt,
} from './prompt-builder';

@Injectable()
export class OcrAiService {
  constructor(
    private readonly contextRepository: AiContextRepository,
    private readonly anthropicClient: AnthropicClientService,
  ) {}

  async run(claimId: string, dto: AiRequestDto): Promise<AiResponse> {
    const claim = await this.contextRepository.getClaimContext(claimId);
    if (!claim) throw new ClaimNotFoundForAiError();

    const { system, user } = this.buildPrompt(claim, dto);
    const content = await this.anthropicClient.complete(system, user);

    return { action: dto.action, content, generatedAt: new Date().toISOString() };
  }

  /**
   * Cada função de IA do escopo original vira um `case` aqui — todas
   * compartilham o mesmo contexto de sinistro (`buildContextBlock`, em
   * prompt-builder.ts), só muda a instrução dada ao modelo.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildPrompt(claim: any, dto: AiRequestDto) {
    switch (dto.action) {
      case 'summary':
        return buildSummaryPrompt(claim);
      case 'missing_documents':
        return buildMissingDocumentsPrompt(claim);
      case 'inconsistencies':
        return buildInconsistenciesPrompt(claim);
      case 'next_steps':
        return buildNextStepsPrompt(claim);
      case 'technical_opinion':
        return buildTechnicalOpinionPrompt(claim);
      case 'history_summary':
        return buildHistorySummaryPrompt(claim);
      case 'email_draft':
        if (!dto.emailPurpose) throw new MissingEmailPurposeError();
        return buildEmailDraftPrompt(claim, dto.emailPurpose);
      case 'ask':
        if (!dto.question) throw new MissingQuestionError();
        return buildAskPrompt(claim, dto.question);
    }
  }

  /**
   * Aplica um valor extraído pelo OCR ao cadastro — ação deliberada do
   * regulador (nunca automática), clicando "Aplicar" na tela de revisão.
   * `vehiclePlate`/`renavam`/`chassis`/`vehicleModel` vivem no próprio
   * Claim; `clientDocument`/`clientName` vivem no Client relacionado.
   */
  async applyOcrField(claimId: string, targetField: string, value: string): Promise<void> {
    const claimFields = ['vehiclePlate', 'renavam', 'chassis', 'vehicleModel'];
    const clientFields = ['clientDocument', 'clientName'];

    if (claimFields.includes(targetField)) {
      await prisma.claim.updateMany({ where: { id: claimId }, data: { [targetField]: value } });
      return;
    }

    if (clientFields.includes(targetField)) {
      const claim = await prisma.claim.findFirst({ where: { id: claimId }, select: { clientId: true } });
      if (!claim) throw new ClaimNotFoundForAiError();
      const prismaField = targetField === 'clientDocument' ? 'document' : 'name';
      await prisma.client.updateMany({ where: { id: claim.clientId }, data: { [prismaField]: value } });
      return;
    }

    throw new Error(`Campo "${targetField}" não é um alvo válido para aplicação de dados de OCR.`);
  }
}

