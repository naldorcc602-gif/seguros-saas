import type { EmailTemplateItem, PreviewEmailResponse, UpdateEmailTemplateInput } from '@seguros/schemas';

import { apiFetch } from './api-client';

export const emailTemplatesApi = {
  list: () => apiFetch<EmailTemplateItem[]>('/email-templates'),

  update: (key: string, input: UpdateEmailTemplateInput) =>
    apiFetch<EmailTemplateItem>(`/email-templates/${key}`, { method: 'PATCH', body: JSON.stringify(input) }),

  preview: (input: UpdateEmailTemplateInput) =>
    apiFetch<PreviewEmailResponse>('/email-templates/preview', { method: 'POST', body: JSON.stringify(input) }),
};
