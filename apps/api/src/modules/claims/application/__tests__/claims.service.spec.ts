// @ts-nocheck
import { ClaimNotFoundError } from '../../domain/claims.errors';
import { ClaimsService } from '../claims.service';

/**
 * Testa a lógica de negócio do ClaimsService com o repositório, o gateway
 * de tempo real e o NotificationsService mockados — nenhuma dependência de
 * banco de dados real.
 */
function makeDeps() {
  const claimsRepository = {
    findAllForKanban: jest.fn(),
    quickCreate: jest.fn(),
    create: jest.fn(),
    updateStage: jest.fn(),
    findAllPaginated: jest.fn(),
    findByIdDetailed: jest.fn(),
    update: jest.fn(),
    addComment: jest.fn(),
  };
  const realtimeGateway = { broadcastToTenant: jest.fn(), emitToUser: jest.fn() };
  const notificationsService = { notifyNewClaim: jest.fn(), notifyStageChanged: jest.fn() };

  const service = new ClaimsService(claimsRepository as never, realtimeGateway as never, notificationsService as never);

  return { service, claimsRepository, realtimeGateway, notificationsService };
}

function makeClaimRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'c1',
    tenantId: 't1',
    internalNumber: '2026-000001',
    stage: 'ADJUSTMENT',
    priority: 'MEDIUM',
    productType: 'AUTO',
    estimatedValue: null,
    assignedUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { name: 'Maria', email: 'maria@example.com' },
    insurer: null,
    broker: null,
    assignedUser: null,
    tags: [],
    ...overrides,
  };
}

describe('ClaimsService.moveStage', () => {
  it('lança ClaimNotFoundError quando o sinistro não existe (ou é de outro tenant)', async () => {
    const { service, claimsRepository } = makeDeps();
    claimsRepository.updateStage.mockResolvedValue(null);

    await expect(service.moveStage('inexistente', { stage: 'PAYMENT' } as never)).rejects.toThrow(ClaimNotFoundError);
  });

  it('emite claim.stage_changed via WebSocket e dispara a notificação de mudança de etapa', async () => {
    const { service, claimsRepository, realtimeGateway, notificationsService } = makeDeps();
    claimsRepository.updateStage.mockResolvedValue(makeClaimRow({ stage: 'PAYMENT' }));

    await service.moveStage('c1', { stage: 'PAYMENT' } as never);

    expect(realtimeGateway.broadcastToTenant).toHaveBeenCalledWith(
      'tenant-test-id',
      'claim.stage_changed',
      expect.objectContaining({ claimId: 'c1', stage: 'PAYMENT' }),
    );
    expect(notificationsService.notifyStageChanged).toHaveBeenCalledWith(
      expect.objectContaining({ claimId: 'c1', tenantId: 't1' }),
      'PAYMENT',
    );
  });
});

describe('ClaimsService.quickCreate', () => {
  it('dispara notifyNewClaim após criar o sinistro', async () => {
    const { service, claimsRepository, notificationsService } = makeDeps();
    claimsRepository.quickCreate.mockResolvedValue(makeClaimRow());

    await service.quickCreate({
      clientName: 'Maria',
      clientDocumentType: 'CPF',
      clientDocument: '12345678901',
      productType: 'AUTO',
    } as never);

    expect(notificationsService.notifyNewClaim).toHaveBeenCalledWith(
      expect.objectContaining({ claimNumber: '2026-000001', clientName: 'Maria' }),
    );
  });
});

