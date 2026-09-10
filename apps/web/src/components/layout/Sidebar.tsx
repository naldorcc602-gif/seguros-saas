'use client';

import {
  ClipboardList,
  Kanban,
  LayoutDashboard,
  LineChart,
  Settings,
  Users,
  Wallet,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUiStore } from '@/stores/ui-store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sinistros', label: 'Sinistros', icon: ClipboardList },
  { href: '/kanban', label: 'Pipeline', icon: Kanban },
  { href: '/cadastros', label: 'Cadastros', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: LineChart },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-surface transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="h-7 w-7 shrink-0 rounded-md bg-primary" aria-hidden />
        {!sidebarCollapsed && (
          <span className="font-display text-sm font-semibold text-ink">Regulação de Sinistros</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-hover hover:text-ink'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm text-muted hover:text-ink"
      >
        {sidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        {!sidebarCollapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}
