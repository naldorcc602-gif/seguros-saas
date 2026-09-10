import { reportToTable } from '../report-to-table';

describe('reportToTable', () => {
  it('resolution-time: uma linha por regulador + uma por seguradora', () => {
    const data = {
      overallAvgDays: 5,
      byRegulator: [{ id: 'u1', name: 'João', avgDays: 4, claimCount: 10 }],
      byInsurer: [{ id: 'i1', name: 'Seguradora A', avgDays: 6, claimCount: 5 }],
    };
    const table = reportToTable('resolution-time', data);

    expect(table.headers).toEqual(['Agrupamento', 'Nome', 'Tempo médio', 'Sinistros']);
    expect(table.rows).toEqual([
      ['Regulador', 'João', '4.0d', '10'],
      ['Seguradora', 'Seguradora A', '6.0d', '5'],
    ]);
  });

  it('resolution-time: formata "—" quando avgDays é null', () => {
    const data = { overallAvgDays: null, byRegulator: [{ id: 'u1', name: 'João', avgDays: null, claimCount: 0 }], byInsurer: [] };
    const table = reportToTable('resolution-time', data);
    expect(table.rows[0]![2]).toBe('—');
  });

  it('financial: formata valores em BRL', () => {
    const data = {
      totalAmount: 1000,
      byType: [{ type: 'PAYMENT', total: 1500.5, count: 3 }],
      monthly: [],
      byInsurer: [],
    };
    const table = reportToTable('financial', data);
    expect(table.rows[0]![2]).toContain('1.500,50');
  });

  it('pending-documents: uma linha por item pendente', () => {
    const data = {
      rows: [
        { claimId: 'c1', claimNumber: '2026-000001', clientName: 'Maria', itemName: 'CNH', status: 'PENDING', daysOpen: 3 },
      ],
    };
    const table = reportToTable('pending-documents', data);
    expect(table.rows).toEqual([['2026-000001', 'Maria', 'CNH', 'PENDING', '3d']]);
  });

  it('sla-compliance: formata percentual com uma casa decimal', () => {
    const data = {
      overall: { id: null, name: 'Geral', total: 10, withinSla: 7, overdue: 3, compliancePct: 70 },
      byInsurer: [],
      byRegulator: [],
    };
    const table = reportToTable('sla-compliance', data);
    expect(table.rows[0]).toEqual(['Geral', 'Geral', '10', '7', '3', '70.0%']);
  });
});
