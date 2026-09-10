import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from './shared/decorators';

/**
 * Endpoint de health check, usado pelo HEALTHCHECK do Docker e por
 * orquestradores (Nginx upstream, futura config de autoscaling).
 * Módulos de negócio (claims, documents, etc.) são adicionados nas
 * próximas fases sem afetar este endpoint.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check — usado pelo Docker/Nginx, sem autenticação' })
  @ApiResponse({ status: 200, description: 'API operacional.' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
