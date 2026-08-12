// @ts-nocheck
import { Module } from '@nestjs/common';

import { DashboardService } from './application/dashboard.service';
import { DashboardRepository } from './infrastructure/dashboard.repository';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}

