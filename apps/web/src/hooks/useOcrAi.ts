import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AiRequestInput } from '@seguros/schemas';

import { ocrAiApi } from '@/lib/ocr-ai-api';

export function useRunAiAction(claimId: string) {
  return useMutation({
    mutationFn: (input: AiRequestInput) => ocrAiApi.run(claimId, input),
  });
}

export function useApplyOcrField(claimId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetField, value }: { targetField: string; value: string }) =>
      ocrAiApi.applyOcrField(claimId, targetField, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'detail', claimId] });
    },
  });
}
