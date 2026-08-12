// @ts-nocheck
import { Module } from '@nestjs/common';

import { ExportService } from './application/export.service';
import { ReportsService } from './application/reports.service';
import { ReportsRepository } from './infrastructure/reports.repository';
import { ReportsController } from './presentation/reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, ExportService],
})
export class ReportsModule {}

