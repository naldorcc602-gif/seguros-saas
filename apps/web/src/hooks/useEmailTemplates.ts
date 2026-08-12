import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmailTemplateItem, UpdateEmailTemplateInput } from '@seguros/schemas';

import { emailTemplatesApi } from '@/lib/email-templates-api';

const QUERY_KEY = ['email-templates'] as const;

export function useEmailTemplates() {
  return useQuery<EmailTemplateItem[]>({ queryKey: QUERY_KEY, queryFn: emailTemplatesApi.list });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: UpdateEmailTemplateInput }) =>
      emailTemplatesApi.update(key, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<EmailTemplateItem[]>(QUERY_KEY, (old) =>
        old?.map((t) => (t.key === updated.key ? updated : t)),
      );
    },
  });
}
