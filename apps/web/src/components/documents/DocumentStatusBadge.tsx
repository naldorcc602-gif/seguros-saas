import { DOCUMENT_STATUS_LABELS, type DocumentStatus } from '@seguros/schemas';

const STATUS_STYLES: Record<DocumentStatus, string> = {
  PENDING: 'bg-muted/10 text-muted',
  RECEIVED: 'bg-primary/10 text-primary',
  APPROVED: 'bg-stage-payment/10 text-stage-payment',
  REJECTED: 'bg-danger/10 text-danger',
  RESUBMISSION_REQUESTED: 'bg-amber/10 text-amber',
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
      {DOCUMENT_STATUS_LABELS[status]}
    </span>
  );
}
