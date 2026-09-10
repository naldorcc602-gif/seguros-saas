import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@seguros/database';

import { CurrentUser, Roles, type AuthenticatedUser } from '../../../shared/decorators';
import { EmailTemplatesService } from '../application/email-templates.service';
import { PreviewEmailTemplateDto, UpdateEmailTemplateDto } from '../application/dto';
import { NotificationsService } from '../application/notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  // ── Sino de notificações (qualquer usuário autenticado) ───────────────
  @Get('notifications')
  @ApiOperation({ summary: 'Lista as notificações do usuário logado + contagem de não lidas' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listForUser(user.userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('notifications/:id/read')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Marca todas as notificações do usuário como lidas' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  // ── Modelos de e-mail (Configurações — Admin/Gestor) ──────────────────
  @Get('email-templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lista os 8 modelos de e-mail do tenant' })
  listTemplates() {
    return this.emailTemplatesService.list();
  }

  @HttpCode(HttpStatus.OK)
  @Patch('email-templates/:key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'key', description: 'Chave do template, ex: "confirmation", "payment"' })
  @ApiOperation({ summary: 'Edita o assunto/corpo de um modelo de e-mail' })
  @ApiResponse({ status: 404, description: 'Chave de template desconhecida.' })
  updateTemplate(@Param('key') key: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.emailTemplatesService.update(key, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('email-templates/preview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Renderiza um preview do template com dados de exemplo (não salva nada)' })
  preview(@Body() dto: PreviewEmailTemplateDto) {
    return this.emailTemplatesService.preview(dto);
  }
}
