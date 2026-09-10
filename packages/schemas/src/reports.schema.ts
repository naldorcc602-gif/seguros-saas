import { z } from 'zod';

export const REPORT_KEYS = ['resolution-time', 'sla-compliance', 'financial', 'productivity', 'pending-documents'] as const;
export type ReportKey = (typeof REPORT_KEYS)[number];

export const REPORT_LABELS: Record<ReportKey, string> = {
  'resolution-time': 'Tempo médio de resolução',
  'sla-compliance': 'Cumprimento de SLA',
  financial: 'Financeiro',
  productivity: 'Produtividade',
  'pending-documents': 'Documentos pendentes',
};

export const EXPORT_FORMATS = ['pdf', 'xlsx', 'csv'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// ── Tempo médio de resolução ──────────────────────────────────────────

export const resolutionTimeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  avgDays: z.number().nullable(),
  claimCount: z.number().int().nonnegative(),
});
export type ResolutionTimeGroup = z.infer<typeof resolutionTimeGroupSchema>;

export const resolutionTimeReportSchema = z.object({
  overallAvgDays: z.number().nullable(),
  byRegulator: z.array(resolutionTimeGroupSchema),
  byInsurer: z.array(resolutionTimeGroupSchema),
});
export type ResolutionTimeReport = z.infer<typeof resolutionTimeReportSchema>;

// ── SLA ────────────────────────────────────────────────────────────────

export const slaGroupSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  total: z.number().int().nonnegative(),
  withinSla: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  compliancePct: z.number().nullable(),
});
export type SlaGroup = z.infer<typeof slaGroupSchema>;

export const slaComplianceReportSchema = z.object({
  overall: slaGroupSchema,
  byInsurer: z.array(slaGroupSchema),
  byRegulator: z.array(slaGroupSchema),
});
export type SlaComplianceReport = z.infer<typeof slaComplianceReportSchema>;

// ── Financeiro ───────────────────────────────────────────────────────

export const financialByTypeSchema = z.object({
  type: z.string(),
  total: z.number(),
  count: z.number().int().nonnegative(),
});
export type FinancialByType = z.infer<typeof financialByTypeSchema>;

export const financialMonthlyPointSchema = z.object({
  month: z.string(),
  total: z.number(),
});
export type FinancialMonthlyPoint = z.infer<typeof financialMonthlyPointSchema>;

export const financialReportSchema = z.object({
  totalAmount: z.number(),
  byType: z.array(financialByTypeSchema),
  monthly: z.array(financialMonthlyPointSchema),
  byInsurer: z.array(z.object({ id: z.string().nullable(), name: z.string(), total: z.number() })),
});
export type FinancialReport = z.infer<typeof financialReportSchema>;

// ── Produtividade ────────────────────────────────────────────────────

export const productivityRowSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  assignedClaims: z.number().int().nonnegative(),
  closedLast30Days: z.number().int().nonnegative(),
  commentsLast30Days: z.number().int().nonnegative(),
});
export type ProductivityRow = z.infer<typeof productivityRowSchema>;

export const productivityReportSchema = z.object({
  rows: z.array(productivityRowSchema),
});
export type ProductivityReport = z.infer<typeof productivityReportSchema>;

// ── Documentos pendentes ─────────────────────────────────────────────

export const pendingDocumentRowSchema = z.object({
  claimId: z.string(),
  claimNumber: z.string(),
  clientName: z.string(),
  itemName: z.string(),
  status: z.string(),
  daysOpen: z.number().int().nonnegative(),
});
export type PendingDocumentRow = z.infer<typeof pendingDocumentRowSchema>;

export const pendingDocumentsReportSchema = z.object({
  rows: z.array(pendingDocumentRowSchema),
});
export type PendingDocumentsReport = z.infer<typeof pendingDocumentsReportSchema>;
