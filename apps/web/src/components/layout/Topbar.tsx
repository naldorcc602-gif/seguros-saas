'use client';

import { Moon, Search, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { NotificationBell } from '@/components/layout/NotificationBell';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export function Topbar() {
  const router = useRouter();
  const { theme, toggle } = useThemeStore();
  const { refreshToken, clear } = useAuthStore();

  const handleLogout = async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined);
    }
    clear();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 bg-surface px-6 shadow-[0_1px_0_0_var(--border)]">
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-bg px-3 py-2 max-w-md">
        <Search size={16} className="text-muted" />
        <input
          placeholder="Buscar por CPF, placa, apólice, nº do sinistro…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-ink"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-ink"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
