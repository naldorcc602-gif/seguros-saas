import { apiFetch } from './api-client';

export interface LoginResponse {
  requiresTwoFactor: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyTwoFactorLogin: (tempToken: string, code: string) =>
    apiFetch<LoginResponse>('/auth/2fa/login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    }),

  registerTenant: (input: {
    tenantName: string;
    tenantDocument?: string;
    adminName: string;
    adminEmail: string;
    password: string;
  }) => apiFetch<{ tenantId: string; userId: string }>('/auth/register-tenant', {
    method: 'POST',
    body: JSON.stringify(input),
  }),

  logout: (refreshToken: string) =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
