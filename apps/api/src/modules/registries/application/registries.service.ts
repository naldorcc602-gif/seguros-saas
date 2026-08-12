// @ts-nocheck
import { Injectable } from '@nestjs/common';

import { RegistryCrudRepository } from '../infrastructure/registry-crud.repository';
import {
  CreateAdjusterDto,
  CreateBrokerDto,
  CreateClientDto,
  CreateDispatcherDto,
  CreateInsurerDto,
  CreateLawyerDto,
  CreateWorkshopDto,
  UpdateAdjusterDto,
  UpdateBrokerDto,
  UpdateClientDto,
  UpdateDispatcherDto,
  UpdateInsurerDto,
  UpdateLawyerDto,
  UpdateWorkshopDto,
} from './dto';

@Injectable()
export class RegistriesService {
  private readonly insurers = new RegistryCrudRepository('insurer');
  private readonly brokers = new RegistryCrudRepository('broker');
  private readonly clients = new RegistryCrudRepository('client');
  private readonly adjusters = new RegistryCrudRepository('adjuster');
  private readonly workshops = new RegistryCrudRepository('workshop');
  private readonly dispatchers = new RegistryCrudRepository('dispatcher');
  private readonly lawyers = new RegistryCrudRepository('lawyer');

  // Seguradoras
  listInsurers = () => this.insurers.list();
  // @ts-ignore
  createInsurer = (dto: CreateInsurerDto) => this.insurers.create(dto);
  // @ts-ignore
  updateInsurer = (id: string, dto: UpdateInsurerDto) => this.insurers.update(id, dto);
  removeInsurer = (id: string) => this.insurers.remove(id);

  // Corretores
  listBrokers = () => this.brokers.list();
  createBroker = (dto: CreateBrokerDto) => this.brokers.create(dto);
  updateBroker = (id: string, dto: UpdateBrokerDto) => this.brokers.update(id, dto);
  removeBroker = (id: string) => this.brokers.remove(id);

  // Clientes
  listClients = () => this.clients.list();
  createClient = (dto: CreateClientDto) => this.clients.create(dto);
  updateClient = (id: string, dto: UpdateClientDto) => this.clients.update(id, dto);
  removeClient = (id: string) => this.clients.remove(id);

  // Peritos
  listAdjusters = () => this.adjusters.list();
  createAdjuster = (dto: CreateAdjusterDto) => this.adjusters.create(dto);
  updateAdjuster = (id: string, dto: UpdateAdjusterDto) => this.adjusters.update(id, dto);
  removeAdjuster = (id: string) => this.adjusters.remove(id);

  // Oficinas
  listWorkshops = () => this.workshops.list();
  createWorkshop = (dto: CreateWorkshopDto) => this.workshops.create(dto);
  updateWorkshop = (id: string, dto: UpdateWorkshopDto) => this.workshops.update(id, dto);
  removeWorkshop = (id: string) => this.workshops.remove(id);

  // Despachantes
  listDispatchers = () => this.dispatchers.list();
  createDispatcher = (dto: CreateDispatcherDto) => this.dispatchers.create(dto);
  updateDispatcher = (id: string, dto: UpdateDispatcherDto) => this.dispatchers.update(id, dto);
  removeDispatcher = (id: string) => this.dispatchers.remove(id);

  // Advogados
  listLawyers = () => this.lawyers.list();
  createLawyer = (dto: CreateLawyerDto) => this.lawyers.create(dto);
  updateLawyer = (id: string, dto: UpdateLawyerDto) => this.lawyers.update(id, dto);
  removeLawyer = (id: string) => this.lawyers.remove(id);
}

