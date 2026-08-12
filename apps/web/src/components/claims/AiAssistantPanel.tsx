'use client';

import { AI_ACTION_LABELS, type AiAction } from '@seguros/schemas';
import { Bot, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { ApiError } from '@/lib/api-client';
import { useRunAiAction } from '@/hooks/useOcrAi';

const QUICK_ACTIONS: AiAction[] = [
  'summary',
  'missing_documents',
  'inconsistencies',
  'next_steps',
  'technical_opinion',
  'history_summary',
];

export function AiAssistantPanel({ claimId }: { claimId: string }) {
  const runAction = useRunAiAction(claimId);
  const [result, setResult] = useState<{ action: AiAction; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [emailPurpose, setEmailPurpose] = useState('');

  const runQuick = async (action: AiAction) => {
    setError(null);
    try {
      const response = await runAction.mutateAsync({ action });
      setResult({ action, content: response.content });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar a resposta.');
    }
  };

  const runAsk = async () => {
    if (!question.trim()) return;
    setError(null);
    try {
      const response = await runAction.mutateAsync({ action: 'ask', question });
      setResult({ action: 'ask', content: response.content });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar a resposta.');
    }
  };

  const runEmailDraft = async () => {
    if (!emailPurpose.trim()) return;
    setError(null);
    try {
      const response = await runAction.mutateAsync({ action: 'email_draft', emailPurpose });
      setResult({ action: 'email_draft', content: response.content });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar a resposta.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot size={16} className="text-primary" />
        <h3 className="font-display text-sm font-semibold text-ink">Assistente de IA</h3>
      </div>
      <p className="text-xs text-muted">
        Minutas geradas automaticamente — sempre revise antes de usar oficialmente no sinistro.
      </p>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => runQuick(action)}
            disabled={runAction.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {AI_ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium text-ink">Perguntar ao assistente</p>
          <div className="mt-1.5 flex gap-1.5">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: quando foi o último documento enviado?"
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
            <button
              onClick={runAsk}
              disabled={runAction.isPending || !question.trim()}
              className="rounded-md bg-primary px-2.5 py-1.5 text-white disabled:opacity-60"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium text-ink">Gerar e-mail</p>
          <div className="mt-1.5 flex gap-1.5">
            <input
              value={emailPurpose}
              onChange={(e) => setEmailPurpose(e.target.value)}
              placeholder="Ex: solicitar reenvio da CNH ilegível"
              className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
            />
            <button
              onClick={runEmailDraft}
              disabled={runAction.isPending || !emailPurpose.trim()}
              className="rounded-md bg-primary px-2.5 py-1.5 text-white disabled:opacity-60"
            >
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      </div>

      {runAction.isPending && <p className="text-sm text-muted">Gerando resposta…</p>}
      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {result && (
        <div className="rounded-lg border border-border bg-bg p-4">
          <p className="text-xs font-medium text-primary">{AI_ACTION_LABELS[result.action]}</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink">{result.content}</p>
        </div>
      )}
    </div>
  );
}
