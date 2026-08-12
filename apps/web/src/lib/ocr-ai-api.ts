import type { AiRequestInput, AiResponse } from '@seguros/schemas';

import { apiFetch } from './api-client';

export const ocrAiApi = {
  run: (claimId: string, input: AiRequestInput) =>
    apiFetch<AiResponse>(`/claims/${claimId}/ai`, { method: 'POST', body: JSON.stringify(input) }),

  applyOcrField: (claimId: string, targetField: string, value: string) =>
    apiFetch<void>(`/claims/${claimId}/ai/apply-ocr-field`, {
      method: 'POST',
      body: JSON.stringify({ targetField, value }),
    }),
};
