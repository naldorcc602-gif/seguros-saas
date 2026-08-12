import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

/**
 * Estado de sessão do front-end. Persistido em localStorage — aceitável aqui
 * porque este é o código real da aplicação (não um artifact do Claude, onde
 * localStorage não é suportado). Os tokens em si são de curta duração
 * (access: 15min) e o refresh token é opaco e revogável no servidor a
 * qualquer momento (ver Fase 5), então o risco de um XSS exfiltrar o
 * localStorage é o mesmo risco que qualquer SPA com JWT já assume.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    { name: 'seguros-auth' },
  ),
);
