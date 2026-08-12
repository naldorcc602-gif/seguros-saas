import type {
  AddCommentInput,
  ClaimDetail,
  ClaimListQuery,
  ClaimListResponse,
  CommentItem,
  CreateClaimInput,
  KanbanCard,
  MoveClaimStageInput,
  QuickCreateClaimInput,
  UpdateClaimInput,
} from '@seguros/schemas';

import { apiFetch } from './api-client';

function toQueryString(query: Partial<ClaimListQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export const claimsApi = {
  listKanban: () => apiFetch<KanbanCard[]>('/claims/kanban'),

  quickCreate: (input: QuickCreateClaimInput) =>
    apiFetch<KanbanCard>('/claims', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  moveStage: (claimId: string, input: MoveClaimStageInput) =>
    apiFetch<KanbanCard>(`/claims/${claimId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  list: (query: Partial<ClaimListQuery>) =>
    apiFetch<ClaimListResponse>(`/claims?${toQueryString(query)}`),

  create: (input: CreateClaimInput) =>
    apiFetch<ClaimDetail>('/claims/full', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getById: (id: string) => apiFetch<ClaimDetail>(`/claims/${id}`),

  update: (id: string, input: UpdateClaimInput) =>
    apiFetch<ClaimDetail>(`/claims/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  addComment: (id: string, input: AddCommentInput) =>
    apiFetch<CommentItem>(`/claims/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
