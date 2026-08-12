'use client';

import { NOTIFICATION_TYPE_LABELS } from '@seguros/schemas';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useNotifications } from '@/hooks/useNotifications';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, markAsRead, markAllAsRead } = useNotifications();
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted hover:bg-surface-hover hover:text-ink"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium text-ink">Notificações</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllAsRead()} className="text-xs text-primary hover:underline">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!data || data.items.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted">Nenhuma notificação ainda.</p>
              ) : (
                data.items.map((n) => {
                  const content = (
                    <div
                      className={`border-b border-border px-4 py-3 text-sm hover:bg-surface-hover ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">{NOTIFICATION_TYPE_LABELS[n.type]}</span>
                        <span className="text-xs text-muted">{formatRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-ink">{n.title}</p>
                      <p className="text-xs text-muted">{n.body}</p>
                    </div>
                  );
                  return n.claimId ? (
                    <Link key={n.id} href={`/sinistros/${n.claimId}`} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
