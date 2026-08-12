'use client';

import type { FinancialReport } from '@seguros/schemas';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function fmtMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function FinancialView({ data }: { data: FinancialReport }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Total movimentado</p>
        <p className="mt-1 font-mono text-2xl font-semibold text-ink">{fmtMoney(data.totalAmount)}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold text-ink">Movimentação mensal</h3>
        {data.monthly.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sem dados suficientes ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [fmtMoney(value), 'Total']}
              />
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-ink">Por tipo</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {data.byType.map((t) => (
                <tr key={t.type} className="border-t border-border">
                  <td className="py-1.5 text-ink">{t.type}</td>
                  <td className="py-1.5 text-right font-mono text-muted">{fmtMoney(t.total)}</td>
                  <td className="py-1.5 text-right text-xs text-muted">{t.count}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-ink">Por seguradora</h3>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {data.byInsurer.map((i) => (
                <tr key={i.id ?? i.name} className="border-t border-border">
                  <td className="py-1.5 text-ink">{i.name}</td>
                  <td className="py-1.5 text-right font-mono text-muted">{fmtMoney(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
