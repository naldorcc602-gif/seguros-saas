import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@seguros/database';

import { Roles } from '../../../shared/decorators';
import { DashboardService } from '../application/dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADJUSTER)
  @ApiOperation({
    summary: 'Resumo em tempo real dos indicadores do dashboard',
    description:
      'Contagens por etapa, valor total estimado, tempo médio de resolução, SLA médio, volume mensal, distribuição por seguradora/corretor/regulador/estado, sinistros críticos e atividade recente.',
  })
  @ApiResponse({ status: 200, description: 'Resumo do dashboard.' })
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
