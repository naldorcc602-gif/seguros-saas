import { Injectable } from '@nestjs/common';
import { EMAIL_TEMPLATE_KEYS, renderTemplateString, type EmailTemplateItem, type PreviewEmailResponse } from '@seguros/schemas';

import { EmailTemplateNotFoundError } from '../domain/notifications.errors';
import { EmailTemplatesRepository } from '../infrastructure/notifications.repository';
import { PreviewEmailTemplateDto, UpdateEmailTemplateDto } from './dto';

/** Dados de exemplo usados no preview do editor — não afeta o template salvo. */
const PREVIEW_SAMPLE_VARIABLES: Record<string, string> = {
  claimNumber: '2026-000123',
  clientName: 'Maria Souza',
  stageLabel: 'Em Regulação',
  insurerName: 'Seguradora Exemplo S.A.',
  brokerName: 'Corretora Exemplo',
  productLabel: 'Automóvel',
  estimatedValue: 'R$ 12.500,00',
  tenantName: 'Sua Corretora',
};

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly repository: EmailTemplatesRepository) {}

  async list(): Promise<EmailTemplateItem[]> {
    const templates = await this.repository.list();
    return templates.map((t) => ({
      id: t.id,
      key: t.key as EmailTemplateItem['key'],
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  async update(key: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplateItem> {
    if (!EMAIL_TEMPLATE_KEYS.includes(key as never)) {
      throw new EmailTemplateNotFoundError();
    }
    const updated = await this.repository.update(key, dto);
    if (!updated) throw new EmailTemplateNotFoundError();
    return {
      id: updated.id,
      key: updated.key as EmailTemplateItem['key'],
      subject: updated.subject,
      bodyHtml: updated.bodyHtml,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  preview(dto: PreviewEmailTemplateDto): PreviewEmailResponse {
    return {
      subject: renderTemplateString(dto.subject, PREVIEW_SAMPLE_VARIABLES),
      bodyHtml: renderTemplateString(dto.bodyHtml, PREVIEW_SAMPLE_VARIABLES),
    };
  }
}
