'use client';

import { Banknote, Clock, FileWarning, Gauge, ListChecks, XCircle } from 'lucide-react';

import { CriticalClaimsList } from '@/components/dashboard/CriticalClaimsList';
import { MonthlyVolumeChart } from '@/components/dashboard/MonthlyVolumeChart';
import { PipelineRibbon } from '@/components/dashboard/PipelineRibbon';
import { RankedBarList } from '@/components/dashboard/RankedBarList';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatDays(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}d`;
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardSummary();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Não foi possível carregar os indicadores. {error instanceof Error ? error.message : ''}
      </div>
    );
  }

  const { totals, byStage, monthly, byInsurer, byBroker, byRegulator, byState, criticalClaims, recentActivity } =
    data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral em tempo real de todos os sinistros do seu tenant.</p>
      </div>

      <PipelineRibbon byStage={byStage} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={String(totals.total)} icon={ListChecks} />
        <StatCard label="Em andamento" value={String(totals.emAndamento)} icon={Gauge} />
        <StatCard label="Encerrados" value={String(totals.encerrados)} icon={ListChecks} tone="default" />
        <StatCard label="Negados" value={String(totals.negados)} icon={XCircle} tone="danger" />
        <StatCard
          label="Valor total estimado"
          value={formatCurrencyBRL(totals.valorTotalEstimado)}
          icon={Banknote}
        />
        <StatCard
          label="SLA médio"
          value={formatDays(totals.slaMedioDias)}
          icon={Clock}
          tone={totals.slaMedioDias && totals.slaMedioDias < 5 ? 'amber' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 xl:col-span-2">
          <h3 className="font-display text-sm font-semibold text-ink">Volume mensal de sinistros</h3>
          <div className="mt-2">
            <MonthlyVolumeChart data={monthly} />
          </div>
        </div>
        <StatCard
          label="Tempo médio de resolução"
          value={formatDays(totals.tempoMedioResolucaoDias)}
          icon={FileWarning}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RankedBarList title="Por seguradora" items={byInsurer} />
        <RankedBarList title="Por corretor" items={byBroker} />
        <RankedBarList title="Por regulador" items={byRegulator} />
        <RankedBarList
          title="Por estado (proxy do mapa de calor)"
          items={byState}
          emptyLabel="Sem dados de localização ainda."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CriticalClaimsList claims={criticalClaims} />
        <RecentActivityFeed events={recentActivity} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 rounded-lg bg-surface" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-surface" />
    </div>
  );
}
