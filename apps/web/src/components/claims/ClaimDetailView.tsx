import type { ClaimDetail } from '@seguros/schemas';

import { PRODUCT_TYPE_LABELS } from '@/lib/validators/claim';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value ?? <span className="text-muted">—</span>}</dd>
    </div>
  );
}

function formatCurrencyBRL(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('pt-BR');
}

export function ClaimDetailView({ claim }: { claim: ClaimDetail }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold text-ink">Segurado</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Nome" value={claim.client.name} />
          <Row label={claim.client.documentType} value={claim.client.document} />
          <Row label="Telefone" value={claim.client.phone} />
          <Row label="WhatsApp" value={claim.client.whatsapp} />
          <Row label="E-mail" value={claim.client.email} />
          <Row label="Endereço" value={claim.client.address} />
          <Row label="Cidade/UF" value={[claim.client.city, claim.client.state].filter(Boolean).join('/') || null} />
          <Row label="CEP" value={claim.client.zipCode} />
        </dl>
        <p className="mt-2 text-xs text-muted">
          Para editar os dados de contato do segurado, use Cadastros &gt; Clientes.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold text-ink">Apólice e produto</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Seguradora" value={claim.insurer?.name} />
          <Row label="Corretor" value={claim.broker?.name} />
          <Row label="Responsável" value={claim.assignedUser?.name} />
          <Row label="Nº na seguradora" value={claim.insurerNumber} />
          <Row label="Nº da apólice" value={claim.policyNumber} />
          <Row label="Produto" value={PRODUCT_TYPE_LABELS[claim.productType]} />
          <Row label="Cobertura" value={claim.coverage} />
          <Row label="Franquia" value={formatCurrencyBRL(claim.deductible)} />
          <Row label="Item segurado" value={claim.insuredItem} />
        </dl>
      </div>

      {(claim.vehiclePlate || claim.chassis || claim.vehicleModel) && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-display text-sm font-semibold text-ink">Veículo</h3>
          <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Placa" value={claim.vehiclePlate} />
            <Row label="RENAVAM" value={claim.renavam} />
            <Row label="Chassi" value={claim.chassis} />
            <Row label="Modelo" value={claim.vehicleModel} />
            <Row label="Ano" value={claim.vehicleYear} />
          </dl>
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="font-display text-sm font-semibold text-ink">Ocorrência</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Data/hora" value={formatDateTime(claim.occurredAt)} />
          <Row label="Local" value={claim.occurredLocation} />
          <Row label="Tipo" value={claim.claimType} />
          <Row label="Causa" value={claim.cause} />
          <Row label="Valor estimado" value={formatCurrencyBRL(claim.estimatedValue)} />
        </dl>
        {claim.description && (
          <div className="mt-3">
            <dt className="text-xs uppercase tracking-wide text-muted">Descrição</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{claim.description}</dd>
          </div>
        )}
        {claim.notes && (
          <div className="mt-3">
            <dt className="text-xs uppercase tracking-wide text-muted">Observações</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{claim.notes}</dd>
          </div>
        )}
      </div>
    </div>
  );
}
