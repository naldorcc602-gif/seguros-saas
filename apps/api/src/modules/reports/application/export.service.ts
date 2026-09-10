import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import type { ReportTable } from './report-to-table';

@Injectable()
export class ExportService {
  toCsv(table: ReportTable): string {
    const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const lines = [table.headers.map(escape).join(','), ...table.rows.map((row) => row.map(escape).join(','))];
    return lines.join('\n');
  }

  async toExcel(table: ReportTable): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(table.title.slice(0, 31)); // limite de 31 caracteres do Excel para nome de aba

    sheet.addRow(table.headers).font = { bold: true };
    for (const row of table.rows) {
      sheet.addRow(row);
    }
    sheet.columns.forEach((column) => {
      column.width = 22;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async toPdf(table: ReportTable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(table.title, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`);
      doc.moveDown(1);

      const colWidth = (doc.page.width - 80) / table.headers.length;
      const startX = doc.page.margins.left;
      let y = doc.y;

      doc.fontSize(10).fillColor('#000');
      table.headers.forEach((header, i) => {
        doc.text(header, startX + i * colWidth, y, { width: colWidth, continued: false });
      });
      y += 18;
      doc.moveTo(startX, y).lineTo(doc.page.width - 40, y).stroke();
      y += 6;

      for (const row of table.rows) {
        if (y > doc.page.height - 60) {
          doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
          y = doc.page.margins.top;
        }
        row.forEach((cell, i) => {
          doc.text(cell, startX + i * colWidth, y, { width: colWidth });
        });
        y += 16;
      }

      doc.end();
    });
  }
}
