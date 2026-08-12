import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

/**
 * Layout compartilhado por todas as rotas autenticadas (dashboard, sinistros,
 * kanban, cadastros, relatórios, financeiro, configurações).
 *
 * A verificação de sessão (redirecionar para /login se não autenticado) será
 * implementada como um middleware do Next.js quando o módulo de Sinistros
 * (Fase 8) trouxer as primeiras rotas realmente protegidas por dado sensível;
 * por ora, chamadas à API sem token simplesmente recebem 401 do backend.
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
