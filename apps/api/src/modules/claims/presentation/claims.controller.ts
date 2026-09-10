import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ClaimsService } from '../application/claims.service';
import {
  AddCommentDto,
  CreateClaimDto,
  ListClaimsQueryDto,
  MoveStageDto,
  QuickCreateClaimDto,
  UpdateClaimDto,
} from '../application/dto';

@ApiTags('claims')
@ApiBearerAuth('access-token')
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // IMPORTANTE: rotas estáticas ('kanban') precisam vir ANTES de ':id' na
  // ordem de declaração, senão o Express tentaria casar "kanban" como um :id.
  @Get('kanban')
  @ApiOperation({ summary: 'Lista todos os sinistros no formato de cartão do Kanban (Fase 7)' })
  @ApiResponse({ status: 200, description: 'Lista de cartões.' })
  listKanban() {
    return this.claimsService.listKanban();
  }

  @Get()
  @ApiOperation({ summary: 'Lista sinistros paginada, com filtros (etapa, prioridade, seguradora, corretor, busca)' })
  @ApiResponse({ status: 200, description: 'Página de sinistros.' })
  list(@Query() query: ListClaimsQueryDto) {
    return this.claimsService.list(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Criação rápida de sinistro (botão "+" do Kanban, Fase 7)',
    description: 'Poucos campos obrigatórios. O cadastro completo (todos os campos do escopo) é `POST /claims/full`.',
  })
  @ApiResponse({ status: 201, description: 'Sinistro criado (formato de cartão do Kanban).' })
  quickCreate(@Body() dto: QuickCreateClaimDto) {
    return this.claimsService.quickCreate(dto);
  }

  @Post('full')
  @ApiOperation({ summary: 'Criação completa de sinistro (Fase 8) — todos os campos do escopo original + terceiros' })
  @ApiResponse({ status: 201, description: 'Sinistro criado (detalhe completo).' })
  create(@Body() dto: CreateClaimDto) {
    return this.claimsService.create(dto);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID do sinistro' })
  @ApiOperation({ summary: 'Detalhe completo do sinistro (dados, terceiros, comentários, timeline, tags)' })
  @ApiResponse({ status: 200, description: 'Detalhe do sinistro.' })
  @ApiResponse({ status: 404, description: 'Sinistro não encontrado (ou pertence a outro tenant).' })
  findById(@Param('id') id: string) {
    return this.claimsService.findById(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'ID do sinistro' })
  @ApiOperation({
    summary: 'Edita os campos do sinistro',
    description: 'Não edita dados do segurado (nome/documento/contato) — isso é feito em Cadastros > Clientes.',
  })
  @ApiResponse({ status: 200, description: 'Sinistro atualizado.' })
  @ApiResponse({ status: 404, description: 'Sinistro não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateClaimDto) {
    return this.claimsService.update(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/stage')
  @ApiParam({ name: 'id', description: 'ID do sinistro' })
  @ApiOperation({ summary: 'Move o sinistro para outra etapa do Kanban', description: 'Dispara notificações in-app e por e-mail (Fase 10).' })
  @ApiResponse({ status: 200, description: 'Sinistro movido.' })
  @ApiResponse({ status: 404, description: 'Sinistro não encontrado.' })
  moveStage(@Param('id') id: string, @Body() dto: MoveStageDto) {
    return this.claimsService.moveStage(id, dto);
  }

  @Post(':id/comments')
  @ApiParam({ name: 'id', description: 'ID do sinistro' })
  @ApiOperation({ summary: 'Adiciona um comentário ao sinistro' })
  @ApiResponse({ status: 201, description: 'Comentário criado.' })
  addComment(@Param('id') id: string, @Body() dto: AddCommentDto) {
    return this.claimsService.addComment(id, dto);
  }
}
