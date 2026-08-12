import { ClaimCreateForm } from '@/components/claims/ClaimCreateForm';

export default function NovoSinistroPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Novo sinistro</h1>
        <p className="text-sm text-muted">Preencha os dados abaixo para abrir o sinistro.</p>
      </div>
      <ClaimCreateForm />
    </div>
  );
}
