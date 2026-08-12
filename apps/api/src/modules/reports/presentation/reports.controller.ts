// @ts-nocheck
import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@seguros/database';
import { EXPORT_FORMATS, REPORT_KEYS, type ExportFormat, type ReportKey } from '@seguros/schemas';
import type { Response } from 'express';

import { Roles } from '../../../shared/decorators';
import { ExportService } from '../application/export.service';
import { reportToTable } from '../application/report-to-table';
import { ReportsService } from '../application/reports.service';

function assertValidKey(key: string): asserts key is ReportKey {
  if (!REPORT_KEYS.includes(key as ReportKey)) {
    throw new BadRequestException(`Relatório desconhecido: ${key}`);
  }
}

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  @Get(':key')
  @ApiParam({ name: 'key', enum: REPORT_KEYS, description: 'Qual dos 5 relatórios buscar' })
  @ApiOperation({ summary: 'Retorna o relatório em JSON (para exibir em tela)' })
  @ApiResponse({ status: 200, description: 'Dados do relatório.' })
  @ApiResponse({ status: 400, description: 'Chave de relatório desconhecida.' })
  get(@Param('key') key: string) {
    assertValidKey(key);
    return this.reportsService.getByKey(key);
  }

  @Get(':key/export')
  @ApiParam({ name: 'key', enum: REPORT_KEYS })
  @ApiQuery({ name: 'format', enum: EXPORT_FORMATS })
  @ApiOperation({
    summary: 'Exporta o relatório como arquivo para download',
    description: 'Todos os 3 formatos partem da mesma tabela genérica — ver docs/12-relatorios.md.',
  })
  @ApiResponse({ status: 200, description: 'Arquivo binário (CSV/XLSX/PDF), com Content-Disposition de download.' })
  @ApiResponse({ status: 400, description: 'Chave de relatório ou formato de exportação inválido.' })
  async export(@Param('key') key: string, @Query('format') format: string, @Res() res: Response) {
    assertValidKey(key);
    if (!EXPORT_FORMATS.includes(format as ExportFormat)) {
      throw new BadRequestException(`Formato de exportação inválido: ${format}. Use ${EXPORT_FORMATS.join(', ')}.`);
    }

    const data = await this.reportsService.getByKey(key);
    const table = reportToTable(key, data);
    const filename = `${key}-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      const csv = this.exportService.toCsv(table);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('\uFEFF' + csv); // BOM para o Excel abrir acentuação em pt-BR corretamente
      return;
    }

    if (format === 'xlsx') {
      const buffer = await this.exportService.toExcel(table);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
      return;
    }

    const buffer = await this.exportService.toPdf(table);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(buffer);
  }
}

