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
      className={`flex h-screen flex-col bg-surface shadow-[1px_0_0_0_var(--border)] transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          RS
        </span>
        {!sidebarCollapsed && (
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Regulação
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted hover:bg-surface-hover hover:text-ink'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon size={17} className="shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center gap-2 px-4 py-3 text-[13px] text-muted transition-colors hover:text-ink"
      >
        {sidebarCollapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        {!sidebarCollapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}
