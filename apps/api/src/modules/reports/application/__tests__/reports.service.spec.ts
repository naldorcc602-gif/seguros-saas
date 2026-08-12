// @ts-nocheck
import { ReportsService } from '../reports.service';

function makeRepositoryMock() {
  return {
    overallAvgResolutionDays: jest.fn(),
    avgResolutionByRegulator: jest.fn(),
    avgResolutionByInsurer: jest.fn(),
    slaOverall: jest.fn(),
    slaByInsurer: jest.fn(),
    slaByRegulator: jest.fn(),
    financialTotal: jest.fn(),
    financialByType: jest.fn(),
    financialMonthly: jest.fn(),
    financialByInsurer: jest.fn(),
    productivityByRegulator: jest.fn(),
    pendingDocuments: jest.fn(),
  };
}

describe('ReportsService.slaCompliance', () => {
  it('calcula corretamente o percentual de cumprimento (withinSla/total)', async () => {
    const repo = makeRepositoryMock();
    repo.slaOverall.mockResolvedValue({ id: null, name: 'Geral', total: 10, withinSla: 8, overdue: 2 });
    repo.slaByInsurer.mockResolvedValue([{ id: 'i1', name: 'Seguradora A', total: 4, withinSla: 4, overdue: 0 }]);
    repo.slaByRegulator.mockResolvedValue([]);

    const service = new ReportsService(repo as never);
    const result = await service.slaCompliance();

    expect(result.overall.compliancePct).toBe(80);
    expect(result.byInsurer[0].compliancePct).toBe(100);
  });

  it('retorna compliancePct null quando não há nenhum sinistro com SLA definido (evita divisão por zero)', async () => {
    const repo = makeRepositoryMock();
    repo.slaOverall.mockResolvedValue({ id: null, name: 'Geral', total: 0, withinSla: 0, overdue: 0 });
    repo.slaByInsurer.mockResolvedValue([]);
    repo.slaByRegulator.mockResolvedValue([]);

    const service = new ReportsService(repo as never);
    const result = await service.slaCompliance();

    expect(result.overall.compliancePct).toBeNull();
  });
});

describe('ReportsService.getByKey', () => {
  it('roteia para o método correto conforme a chave', async () => {
    const repo = makeRepositoryMock();
    repo.overallAvgResolutionDays.mockResolvedValue(3.5);
    repo.avgResolutionByRegulator.mockResolvedValue([]);
    repo.avgResolutionByInsurer.mockResolvedValue([]);

    const service = new ReportsService(repo as never);
    const result = await service.getByKey('resolution-time');

    expect(result).toEqual({ overallAvgDays: 3.5, byRegulator: [], byInsurer: [] });
  });

  it('lança erro para uma chave de relatório desconhecida', async () => {
    const repo = makeRepositoryMock();
    const service = new ReportsService(repo as never);
    await expect(service.getByKey('relatorio-inexistente')).rejects.toThrow();
  });
});

