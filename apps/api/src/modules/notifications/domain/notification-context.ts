/**
 * Dados mínimos que qualquer módulo (Claims, Documents) precisa fornecer
 * para o NotificationsService disparar notificações in-app + e-mail.
 *
 * Propositalmente NÃO é o NotificationsService que busca esses dados no
 * banco — ele recebe prontos do chamador. Isso evita que NotificationsModule
 * precise importar ClaimsModule (o que criaria um ciclo, já que ClaimsModule
 * importa NotificationsModule para disparar as notificações).
 */
export interface ClaimNotificationContext {
  tenantId: string;
  claimId: string;
  claimNumber: string;
  clientName: string;
  clientEmail?: string | null;
  assignedUserId?: string | null;
  stageLabel?: string;
  insurerName?: string | null;
  brokerName?: string | null;
  productLabel?: string;
  estimatedValue?: number | null;
  tenantName?: string;
}
