// @ts-nocheck
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../../../shared/decorators';
import { DocumentsService } from '../application/documents.service';
import { ConfirmUploadDto, PresignUploadDto } from '../application/dto';

/**
 * Portal público de upload do cliente — SEM autenticação (JWT). O controle
 * de acesso é o próprio token do link (`GenerateUploadLinkDto`, gerado pelo
 * regulador na tela do sinistro): um segredo aleatório de 24 bytes, validado
 * e com expiração opcional. Nenhuma rota aqui aceita ou usa o Bearer token —
 * por isso este controller não tem `@ApiBearerAuth`, ao contrário de todos
 * os outros desta API.
 */
@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Public()
  @Get(':token')
  @ApiParam({ name: 'token', description: 'Token do link seguro (não é um JWT)' })
  @ApiOperation({ summary: 'Dados do sinistro + checklist pendente, para o segurado ver o que falta enviar' })
  @ApiResponse({ status: 200, description: 'Informações do sinistro para o portal.' })
  @ApiResponse({ status: 404, description: 'Link inválido.' })
  @ApiResponse({ status: 410, description: 'Link expirado.' })
  getInfo(@Param('token') token: string) {
    return this.documentsService.getPortalInfo(token);
  }

  @Public()
  @Post(':token/documents/presign')
  @ApiParam({ name: 'token' })
  @ApiOperation({ summary: 'Presign de upload pelo portal público (passo 1)' })
  presignUpload(@Param('token') token: string, @Body() dto: PresignUploadDto) {
    return this.documentsService.presignPortalUpload(token, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(':token/documents/confirm')
  @ApiParam({ name: 'token' })
  @ApiOperation({
    summary: 'Confirma o upload pelo portal público (passo 2)',
    description: 'Registra IP e geolocalização (se o navegador do cliente permitir) do envio.',
  })
  confirmUpload(@Param('token') token: string, @Body() dto: ConfirmUploadDto, @Req() req: Request) {
    return this.documentsService.confirmPortalUpload(token, dto, req.ip);
  }
}

