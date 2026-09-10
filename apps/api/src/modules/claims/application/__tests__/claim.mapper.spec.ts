import { toClaimListItem, toKanbanCard } from '../claim.mapper';

function makeClaim(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'c1',
    internalNumber: '2026-000001',
    stage: 'NEW',
    priority: 'HIGH',
    productType: 'AUTO',
    estimatedValue: 1500.5,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    updatedAt: new Date(),
    client: { name: 'Maria Souza' },
    insurer: { name: 'Seguradora A' },
    broker: null,
    assignedUser: null,
    tags: [{ tag: { id: 't1', name: 'Urgente', color: '#FF0000' } }],
    ...overrides,
  };
}

describe('toKanbanCard', () => {
  it('mapeia os campos básicos corretamente', () => {
    const card = toKanbanCard(makeClaim() as never);

    expect(card.id).toBe('c1');
    expect(card.internalNumber).toBe('2026-000001');
    expect(card.clientName).toBe('Maria Souza');
    expect(card.insurerName).toBe('Seguradora A');
    expect(card.brokerName).toBeNull();
  });

  it('calcula daysOpen a partir de createdAt', () => {
    const card = toKanbanCard(makeClaim() as never);
    expect(card.daysOpen).toBe(3);
  });

  it('converte estimatedValue (Decimal do Prisma) para number', () => {
    const card = toKanbanCard(makeClaim({ estimatedValue: 1500.5 }) as never);
    expect(card.estimatedValue).toBe(1500.5);
  });

  it('retorna estimatedValue null quando não definido', () => {
    const card = toKanbanCard(makeClaim({ estimatedValue: null }) as never);
    expect(card.estimatedValue).toBeNull();
  });

  it('mapeia as tags corretamente', () => {
    const card = toKanbanCard(makeClaim() as never);
    expect(card.tags).toEqual([{ id: 't1', name: 'Urgente', color: '#FF0000' }]);
  });

  it('retorna array de tags vazio quando o sinistro não tem nenhuma', () => {
    const card = toKanbanCard(makeClaim({ tags: [] }) as never);
    expect(card.tags).toEqual([]);
  });
});

describe('toClaimListItem', () => {
  it('é o mesmo mapeamento de toKanbanCard (mesmo formato de dados)', () => {
    const claim = makeClaim();
    expect(toClaimListItem(claim as never)).toEqual(toKanbanCard(claim as never));
  });
});
