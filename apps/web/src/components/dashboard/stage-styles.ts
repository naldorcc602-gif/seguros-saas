import type { ClaimStage } from '@seguros/schemas';

export const STAGE_BG_CLASS: Record<ClaimStage, string> = {
  NEW: 'bg-stage-new',
  INITIAL_CONTACT: 'bg-stage-initial-contact',
  DOCS_PENDING: 'bg-stage-docs-pending',
  DOCS_RECEIVED: 'bg-stage-docs-received',
  ANALYSIS: 'bg-stage-analysis',
  INSPECTION: 'bg-stage-inspection',
  ADJUSTMENT: 'bg-stage-adjustment',
  INSURER: 'bg-stage-insurer',
  PAYMENT: 'bg-stage-payment',
  COMPLETED: 'bg-stage-completed',
  DENIED: 'bg-stage-denied',
};

export const STAGE_TEXT_CLASS: Record<ClaimStage, string> = {
  NEW: 'text-stage-new',
  INITIAL_CONTACT: 'text-stage-initial-contact',
  DOCS_PENDING: 'text-stage-docs-pending',
  DOCS_RECEIVED: 'text-stage-docs-received',
  ANALYSIS: 'text-stage-analysis',
  INSPECTION: 'text-stage-inspection',
  ADJUSTMENT: 'text-stage-adjustment',
  INSURER: 'text-stage-insurer',
  PAYMENT: 'text-stage-payment',
  COMPLETED: 'text-stage-completed',
  DENIED: 'text-stage-denied',
};
