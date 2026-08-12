'use client';

import type { ClaimDetail } from '@seguros/schemas';
import { useState } from 'react';

import { useAddComment } from '@/hooks/useClaimDetail';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function ThirdPartiesTab({ claim }: { claim: ClaimDetail }) {
  if (claim.thirdParties.length === 0) {
    return <p className="text-sm text-muted">Nenhum terceiro envolvido registrado neste sinistro.</p>;
  }
  return (
    <div className="space-y-2">
      {claim.thirdParties.map((tp) => (
        <div key={tp.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
          <p className="font-medium text-ink">{tp.name}</p>
          <p className="text-xs text-muted">
            {[tp.document, tp.phone, tp.vehiclePlate].filter(Boolean).join(' · ') || 'Sem dados adicionais'}
          </p>
          {tp.description && <p className="mt-1 text-xs text-muted">{tp.description}</p>}
        </div>
      ))}
    </div>
  );
}

export function CommentsTab({ claim }: { claim: ClaimDetail }) {
  const [content, setContent] = useState('');
  const addComment = useAddComment(claim.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addComment.mutateAsync({ content });
    setContent('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentário…"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={addComment.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Enviar
        </button>
      </form>

      {claim.comments.length === 0 ? (
        <p className="text-sm text-muted">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-3">
          {claim.comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
              <p className="text-ink">{comment.content}</p>
              <p className="mt-1 text-xs text-muted">
                {comment.authorName ?? 'Usuário'} · {formatDateTime(comment.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TimelineTab({ claim }: { claim: ClaimDetail }) {
  if (claim.timelineEvents.length === 0) {
    return <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>;
  }
  return (
    <ul className="space-y-3">
      {claim.timelineEvents.map((event) => (
        <li key={event.id} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <div>
            <p className="text-ink">{event.description}</p>
            <p className="text-xs text-muted">{formatDateTime(event.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
