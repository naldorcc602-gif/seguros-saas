import type {
  ConfirmUploadInput,
  PortalClaimInfo,
  PresignUploadInput,
  PresignUploadResponse,
} from '@seguros/schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Cliente HTTP dedicado ao portal público — NÃO usa o `apiFetch` autenticado
 * (que anexa Bearer token e tenta refresh em 401). O portal do cliente é
 * acessado sem login; qualquer 401/404 aqui significa token inválido/expirado,
 * não sessão expirada.
 */
async function portalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message ?? 'Não foi possível completar a solicitação.');
  }
  return res.json();
}

export const portalApi = {
  getInfo: (token: string) => portalFetch<PortalClaimInfo>(`/portal/${token}`),

  presign: (token: string, input: PresignUploadInput) =>
    portalFetch<PresignUploadResponse>(`/portal/${token}/documents/presign`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  confirm: (token: string, input: ConfirmUploadInput) =>
    portalFetch<{ id: string }>(`/portal/${token}/documents/confirm`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
