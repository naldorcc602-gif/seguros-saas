// @ts-nocheck
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@seguros/database';

import { Roles } from '../../../shared/decorators';
import { RegistriesService } from '../application/registries.service';
import * as dto from '../application/dto';

/**
 * Todas as rotas de cadastro exigem papel ADMIN, MANAGER ou SUPERVISOR —
 * são dados de configuração/operação, não algo que um Assistente ou
 * Regulador deveria poder alterar livremente. Se isso precisar ser mais
 * granular no futuro (ex: Assistente pode criar cliente mas não seguradora),
 * a evolução é trocar por @RequirePermissions específicas por entidade.
 *
 * Nota sobre a documentação Swagger desta fase: os 7 cadastros seguem o
 * mesmo padrão CRUD (listar/criar/editar/remover), então cada método tem um
 * `@ApiOperation` com resumo, mas sem repetir `@ApiResponse` para cada um dos
 * 28 endpoints — o comportamento de sucesso/erro é idêntico em todos
 * (200/201/204 em sucesso, 409 se o registro estiver em uso por um
 * sinistro ao tentar remover), documentado uma vez aqui no cabeçalho da
 * classe em vez de repetido 28 vezes.
 */
@ApiTags('registries')
@ApiBearerAuth('access-token')
@Controller('registries')
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
export class RegistriesController {
  constructor(private readonly registries: RegistriesService) {}

  // ── Seguradoras ──────────────────────────────────────────────
  @Get('insurers')
  @ApiOperation({ summary: 'Lista as seguradoras cadastradas' })
  listInsurers() {
    return this.registries.listInsurers();
  }
  @Post('insurers')
  @ApiOperation({ summary: 'Cadastra uma nova seguradora' })
  createInsurer(@Body() body: dto.CreateInsurerDto) {
    return this.registries.createInsurer(body);
  }
  @Patch('insurers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita uma seguradora' })
  updateInsurer(@Param('id') id: string, @Body() body: dto.UpdateInsurerDto) {
    return this.registries.updateInsurer(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('insurers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove uma seguradora (falha com 409 se estiver vinculada a sinistros)' })
  @ApiResponse({ status: 409, description: 'Seguradora vinculada a um ou mais sinistros.' })
  removeInsurer(@Param('id') id: string) {
    return this.registries.removeInsurer(id);
  }

  // ── Corretores ───────────────────────────────────────────────
  @Get('brokers')
  @ApiOperation({ summary: 'Lista os corretores cadastrados' })
  listBrokers() {
    return this.registries.listBrokers();
  }
  @Post('brokers')
  @ApiOperation({ summary: 'Cadastra um novo corretor' })
  createBroker(@Body() body: dto.CreateBrokerDto) {
    return this.registries.createBroker(body);
  }
  @Patch('brokers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita um corretor' })
  updateBroker(@Param('id') id: string, @Body() body: dto.UpdateBrokerDto) {
    return this.registries.updateBroker(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('brokers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um corretor (falha com 409 se estiver vinculado a sinistros)' })
  removeBroker(@Param('id') id: string) {
    return this.registries.removeBroker(id);
  }

  // ── Clientes ─────────────────────────────────────────────────
  @Get('clients')
  @ApiOperation({ summary: 'Lista os clientes (segurados) cadastrados' })
  listClients() {
    return this.registries.listClients();
  }
  @Post('clients')
  @ApiOperation({ summary: 'Cadastra um novo cliente' })
  createClient(@Body() body: dto.CreateClientDto) {
    return this.registries.createClient(body);
  }
  @Patch('clients/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita um cliente' })
  updateClient(@Param('id') id: string, @Body() body: dto.UpdateClientDto) {
    return this.registries.updateClient(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('clients/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um cliente (falha com 409 se tiver sinistros vinculados)' })
  removeClient(@Param('id') id: string) {
    return this.registries.removeClient(id);
  }

  // ── Peritos ──────────────────────────────────────────────────
  @Get('adjusters')
  @ApiOperation({ summary: 'Lista os peritos cadastrados' })
  listAdjusters() {
    return this.registries.listAdjusters();
  }
  @Post('adjusters')
  @ApiOperation({ summary: 'Cadastra um novo perito' })
  createAdjuster(@Body() body: dto.CreateAdjusterDto) {
    return this.registries.createAdjuster(body);
  }
  @Patch('adjusters/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita um perito' })
  updateAdjuster(@Param('id') id: string, @Body() body: dto.UpdateAdjusterDto) {
    return this.registries.updateAdjuster(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('adjusters/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um perito' })
  removeAdjuster(@Param('id') id: string) {
    return this.registries.removeAdjuster(id);
  }

  // ── Oficinas ─────────────────────────────────────────────────
  @Get('workshops')
  @ApiOperation({ summary: 'Lista as oficinas cadastradas' })
  listWorkshops() {
    return this.registries.listWorkshops();
  }
  @Post('workshops')
  @ApiOperation({ summary: 'Cadastra uma nova oficina' })
  createWorkshop(@Body() body: dto.CreateWorkshopDto) {
    return this.registries.createWorkshop(body);
  }
  @Patch('workshops/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita uma oficina' })
  updateWorkshop(@Param('id') id: string, @Body() body: dto.UpdateWorkshopDto) {
    return this.registries.updateWorkshop(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('workshops/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove uma oficina' })
  removeWorkshop(@Param('id') id: string) {
    return this.registries.removeWorkshop(id);
  }

  // ── Despachantes ─────────────────────────────────────────────
  @Get('dispatchers')
  @ApiOperation({ summary: 'Lista os despachantes cadastrados' })
  listDispatchers() {
    return this.registries.listDispatchers();
  }
  @Post('dispatchers')
  @ApiOperation({ summary: 'Cadastra um novo despachante' })
  createDispatcher(@Body() body: dto.CreateDispatcherDto) {
    return this.registries.createDispatcher(body);
  }
  @Patch('dispatchers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita um despachante' })
  updateDispatcher(@Param('id') id: string, @Body() body: dto.UpdateDispatcherDto) {
    return this.registries.updateDispatcher(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('dispatchers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um despachante' })
  removeDispatcher(@Param('id') id: string) {
    return this.registries.removeDispatcher(id);
  }

  // ── Advogados ────────────────────────────────────────────────
  @Get('lawyers')
  @ApiOperation({ summary: 'Lista os advogados cadastrados' })
  listLawyers() {
    return this.registries.listLawyers();
  }
  @Post('lawyers')
  @ApiOperation({ summary: 'Cadastra um novo advogado' })
  createLawyer(@Body() body: dto.CreateLawyerDto) {
    return this.registries.createLawyer(body);
  }
  @Patch('lawyers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Edita um advogado' })
  updateLawyer(@Param('id') id: string, @Body() body: dto.UpdateLawyerDto) {
    return this.registries.updateLawyer(id, body);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('lawyers/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Remove um advogado' })
  removeLawyer(@Param('id') id: string) {
    return this.registries.removeLawyer(id);
  }
}

