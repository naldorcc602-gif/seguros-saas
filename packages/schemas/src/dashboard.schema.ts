import { z } from 'zod';

export const claimStageEnum = z.enum([
  'NEW',
  'INITIAL_CONTACT',
  'DOCS_PENDING',
  'DOCS_RECEIVED',
  'ANALYSIS',
  'INSPECTION',
  'ADJUSTMENT',
  'INSURER',
  'PAYMENT',
  'COMPLETED',
  'DENIED',
]);
export type ClaimStage = z.infer<typeof claimStageEnum>;

/** Rótulos em pt-BR para cada etapa — usados pela fita de pipeline e pelos gráficos. */
export const CLAIM_STAGE_LABELS: Record<ClaimStage, string> = {
  NEW: 'Novo',
  INITIAL_CONTACT: 'Contato Inicial',
  DOCS_PENDING: 'Aguardando Cliente',
  DOCS_RECEIVED: 'Documentação Recebida',
  ANALYSIS: 'Análise',
  INSPECTION: 'Em Vistoria',
  ADJUSTMENT: 'Em Regulação',
  INSURER: 'Aguardando Seguradora',
  PAYMENT: 'Pagamento Liberado',
  COMPLETED: 'Encerrado',
  DENIED: 'Negado',
};

/** Cor semântica por etapa, usada na fita de pipeline (mapeadas para as CSS vars do design system). */
export const CLAIM_STAGE_COLOR_VAR: Record<ClaimStage, string> = {
  NEW: '--stage-new',
  INITIAL_CONTACT: '--stage-initial-contact',
  DOCS_PENDING: '--stage-docs-pending',
  DOCS_RECEIVED: '--stage-docs-received',
  ANALYSIS: '--stage-analysis',
  INSPECTION: '--stage-inspection',
  ADJUSTMENT: '--stage-adjustment',
  INSURER: '--stage-insurer',
  PAYMENT: '--stage-payment',
  COMPLETED: '--stage-completed',
  DENIED: '--stage-denied',
};

export const dashboardStageCountSchema = z.object({
  stage: claimStageEnum,
  count: z.number().int().nonnegative(),
});

export const dashboardMonthlyPointSchema = z.object({
  month: z.string(), // "2026-01"
  count: z.number().int().nonnegative(),
});

export const dashboardGroupCountSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});

export const dashboardCriticalClaimSchema = z.object({
  id: z.string(),
  internalNumber: z.string(),
  clientName: z.string(),
  stage: claimStageEnum,
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  daysOpen: z.number().int().nonnegative(),
  slaDueAt: z.string().nullable(),
});

export const dashboardActivitySchema = z.object({
  id: z.string(),
  claimId: z.string(),
  claimInternalNumber: z.string(),
  type: z.string(),
  description: z.string(),
  createdAt: z.string(),
});

export const dashboardSummarySchema = z.object({
  totals: z.object({
    total: z.number().int().nonnegative(),
    emAndamento: z.number().int().nonnegative(),
    encerrados: z.number().int().nonnegative(),
    negados: z.number().int().nonnegative(),
    valorTotalEstimado: z.number().nonnegative(),
    tempoMedioResolucaoDias: z.number().nonnegative().nullable(),
    slaMedioDias: z.number().nonnegative().nullable(),
  }),
  byStage: z.array(dashboardStageCountSchema),
  monthly: z.array(dashboardMonthlyPointSchema),
  byInsurer: z.array(dashboardGroupCountSchema),
  byBroker: z.array(dashboardGroupCountSchema),
  byRegulator: z.array(dashboardGroupCountSchema),
  byState: z.array(dashboardGroupCountSchema),
  criticalClaims: z.array(dashboardCriticalClaimSchema),
  recentActivity: z.array(dashboardActivitySchema),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
