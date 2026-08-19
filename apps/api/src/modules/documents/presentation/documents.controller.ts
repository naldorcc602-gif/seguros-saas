// @ts-nocheck
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { DocumentsService } from '../application/documents.service';
import {
  AttachLinkDto,
  ConfirmUploadDto,
  CreateChecklistTemplateDto,
  GenerateUploadLinkDto,
  PresignUploadDto,
  UpdateChecklistItemStatusDto,
  UpdateDocumentStatusDto,
} from '../application/dto';

@ApiTags('documents')
@ApiBearerAuth('access-token')
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Ã¢â€â‚¬Ã¢â€â‚¬ Upload (por sinistro) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  @Post('claims/:claimId/documents/presign')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({
    summary: 'Gera uma URL prÃƒÂ©-assinada para upload direto ao S3/R2',
    description: 'Passo 1 do upload: o navegador faz o PUT direto para `uploadUrl`, sem passar pela API.',
  })
  presignUpload(@Param('claimId') claimId: string, @Body() dto: PresignUploadDto) {
    return this.documentsService.presignUpload(claimId, dto);
  }

  @Post('claims/:claimId/documents/confirm')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Confirma o upload (passo 2) Ã¢â‚¬â€ grava o metadado, dispara OCR e notificaÃƒÂ§ÃƒÂµes' })
  confirmUpload(@Param('claimId') claimId: string, @Body() dto: ConfirmUploadDto) {
    return this.documentsService.confirmUpload(claimId, dto);
  }

  @Post('claims/:claimId/documents/link')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Anexa um documento como link externo, sem upload de arquivo' })
  attachLink(@Param('claimId') claimId: string, @Body() dto: AttachLinkDto) {
    return this.documentsService.attachLink(claimId, dto);
  }

  @Get('claims/:claimId/documents')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Lista os documentos do sinistro' })
  listDocuments(@Param('claimId') claimId: string) {
    return this.documentsService.listByClaim(claimId);
  }

  @Get('documents/:id/download')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Gera uma URL prÃƒÂ©-assinada de download (o bucket nunca ÃƒÂ© pÃƒÂºblico)' })
  getDownloadUrl(@Param('id') id: string) {
    return this.documentsService.getDownloadUrl(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('documents/:id/status')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Aprova, rejeita ou marca um documento como pendente' })
  updateDocumentStatus(@Param('id') id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentsService.updateStatus(id, dto.status);
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ VersÃƒÂµes Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  @Post('documents/:id/versions/presign')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Presign para reenvio de um documento jÃƒÂ¡ existente (nova versÃƒÂ£o)' })
  presignVersion(@Param('id') id: string, @Body() dto: PresignUploadDto) {
    return this.documentsService.presignNewVersion(id, dto);
  }

  @Post('documents/:id/versions/confirm')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Confirma uma nova versÃƒÂ£o do documento (nada ÃƒÂ© sobrescrito, o histÃƒÂ³rico fica preservado)' })
  confirmVersion(@Param('id') id: string, @Body() dto: ConfirmUploadDto) {
    return this.documentsService.confirmNewVersion(id, dto.storageKey);
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Checklist do sinistro Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  @Get('claims/:claimId/checklist')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Lista o checklist de documentos do sinistro (copiado do template na criaÃƒÂ§ÃƒÂ£o, Fase 9)' })
  listChecklist(@Param('claimId') claimId: string) {
    return this.documentsService.listChecklist(claimId);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('checklist-items/:id/status')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Atualiza o status de um item do checklist' })
  updateChecklistItemStatus(@Param('id') id: string, @Body() dto: UpdateChecklistItemStatusDto) {
    return this.documentsService.updateChecklistItemStatus(id, dto.status);
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Templates de checklist (configuraÃƒÂ§ÃƒÂ£o, por tipo de produto) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  @Get('checklist-templates')
  @ApiQuery({ name: 'productType', required: false })
  @ApiOperation({ summary: 'Lista os templates de checklist (opcionalmente filtrados por tipo de produto)' })
  listChecklistTemplates(@Query('productType') productType?: string) {
    return this.documentsService.listChecklistTemplates(productType);
  }

  @Post('checklist-templates')
  @ApiOperation({ summary: 'Cria um item de template de checklist para um tipo de produto' })
  createChecklistTemplate(@Body() dto: CreateChecklistTemplateDto) {
    return this.documentsService.createChecklistTemplate(dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-templates/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um item de template de checklist' })
  removeChecklistTemplate(@Param('id') id: string) {
    return this.documentsService.removeChecklistTemplate(id);
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Links de upload (portal do cliente) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  @Post('claims/:claimId/upload-links')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Gera um novo link seguro de upload para o cliente (portal pÃƒÂºblico, sem login)' })
  generateUploadLink(@Param('claimId') claimId: string, @Body() dto: GenerateUploadLinkDto) {
    return this.documentsService.generateUploadLink(claimId, dto);
  }

  @Get('claims/:claimId/upload-links')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({ summary: 'Lista os links de upload jÃƒÂ¡ gerados para o sinistro' })
  listUploadLinks(@Param('claimId') claimId: string) {
    return this.documentsService.listUploadLinks(claimId);
  }
}



