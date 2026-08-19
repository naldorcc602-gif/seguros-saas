// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, getCurrentUserId } from '@seguros/database';
import type { DocumentItem, PortalClaimInfo, PresignUploadResponse, UploadLinkItem } from '@seguros/schemas';

import { RealtimeGateway } from '../../../shared/realtime/realtime.gateway';
import type { ClaimNotificationContext } from '../../notifications/domain/notification-context';
import { NotificationsService } from '../../notifications/application/notifications.service';
import {
  ChecklistItemNotFoundError,
  ClaimNotFoundForUploadError,
  DocumentNotFoundError,
  ExpiredUploadLinkError,
  InvalidUploadLinkError,
} from '../domain/documents.errors';
import { DocumentsRepository } from '../infrastructure/documents.repository';
import { OcrQueueService } from '../infrastructure/ocr-queue.service';
import { StorageService } from '../infrastructure/storage.service';
import { toChecklistItem, toDocumentItem } from './document.mapper';
import {
  AttachLinkDto,
  ConfirmUploadDto,
  CreateChecklistTemplateDto,
  GenerateUploadLinkDto,
  PresignUploadDto,
} from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly storageService: StorageService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
    private readonly ocrQueueService: OcrQueueService,
  ) {}

  // â”€â”€ Upload autenticado (regulador/assistente anexando documentos) â”€â”€â”€â”€

  async presignUpload(claimId: string, dto: PresignUploadDto): Promise<PresignUploadResponse> {
    const tenantId = getCurrentTenantId()!;
    const storageKey = this.storageService.buildStorageKey(tenantId, claimId, dto.fileName);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(storageKey, dto.mimeType);
    return { uploadUrl, storageKey };
  }

  async confirmUpload(claimId: string, dto: ConfirmUploadDto): Promise<DocumentItem> {
    const userId = getCurrentUserId();
    const doc = await this.documentsRepository.create({
      claimId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      storageKey: dto.storageKey,
      checklistItemId: dto.checklistItemId,
      uploadedByUserId: userId,
      uploadedByClient: false,
    });
    if (!doc) throw new ClaimNotFoundForUploadError();

    if (dto.checklistItemId) {
      await this.documentsRepository.updateChecklistItemStatus(dto.checklistItemId, 'RECEIVED');
    }

    this.broadcastUpload(doc.tenantId, claimId, doc);
    await this.notifyDocumentEvent(claimId, 'uploaded', doc.fileName);
    await this.ocrQueueService.enqueueIfEligible({
      tenantId: doc.tenantId,
      documentId: doc.id,
      storageKey: doc.storageKey,
      mimeType: doc.mimeType,
    });
    return toDocumentItem(doc);
  }

  async attachLink(claimId: string, dto: AttachLinkDto): Promise<DocumentItem> {
    const userId = getCurrentUserId();
    const doc = await this.documentsRepository.create({
      claimId,
      fileName: dto.fileName,
      externalUrl: dto.url,
      checklistItemId: dto.checklistItemId,
      uploadedByUserId: userId,
      uploadedByClient: false,
    });
    if (!doc) throw new ClaimNotFoundForUploadError();

    if (dto.checklistItemId) {
      await this.documentsRepository.updateChecklistItemStatus(dto.checklistItemId, 'RECEIVED');
    }

    this.broadcastUpload(doc.tenantId, claimId, doc);
    await this.notifyDocumentEvent(claimId, 'uploaded', doc.fileName);
    return toDocumentItem(doc);
  }

  async listByClaim(claimId: string): Promise<DocumentItem[]> {
    const docs = await this.documentsRepository.listByClaim(claimId);
    return docs.map(toDocumentItem);
  }

  async getDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
    const doc = await this.documentsRepository.findById(documentId);
    if (!doc) throw new DocumentNotFoundError();
    if (doc.externalUrl) {
      return { url: doc.externalUrl, fileName: doc.fileName };
    }
    const url = await this.storageService.getPresignedDownloadUrl(doc.storageKey!);
    return { url, fileName: doc.fileName };
  }

  async updateStatus(documentId: string, status: string): Promise<DocumentItem> {
    const doc = await this.documentsRepository.updateStatus(documentId, status);
    if (!doc) throw new DocumentNotFoundError();

    if (status === 'APPROVED' || status === 'REJECTED' || status === 'PENDING') {
      const kind = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'pending';
      await this.notifyDocumentEvent(doc.claimId, kind, doc.fileName);
    }
    return toDocumentItem(doc);
  }

  // â”€â”€ VersÃµes (reenvio de um documento jÃ¡ existente) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async presignNewVersion(documentId: string, dto: PresignUploadDto): Promise<PresignUploadResponse> {
    const existing = await this.documentsRepository.findById(documentId);
    if (!existing) throw new DocumentNotFoundError();

    const storageKey = this.storageService.buildStorageKey(existing.tenantId, existing.claimId, dto.fileName);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(storageKey, dto.mimeType);
    return { uploadUrl, storageKey };
  }

  async confirmNewVersion(documentId: string, storageKey: string): Promise<DocumentItem> {
    const userId = getCurrentUserId();
    const updated = await this.documentsRepository.addVersion(documentId, storageKey, userId);
    if (!updated) throw new DocumentNotFoundError();

    this.broadcastUpload(updated.tenantId, updated.claimId, {
      id: updated.id,
      fileName: updated.fileName,
      uploadedByClient: false,
    });
    return toDocumentItem(updated);
  }

  // â”€â”€ Checklist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async listChecklist(claimId: string) {
    const items = await this.documentsRepository.listChecklistByClaim(claimId);
    return items.map(toChecklistItem);
  }

  async updateChecklistItemStatus(itemId: string, status: string) {
    const item = await this.documentsRepository.updateChecklistItemStatus(itemId, status);
    if (!item) throw new ChecklistItemNotFoundError();
    return toChecklistItem(item);
  }

  async listChecklistTemplates(productType?: string) {
    return this.documentsRepository.listChecklistTemplates(productType);
  }

  async createChecklistTemplate(dto: CreateChecklistTemplateDto) {
    return this.documentsRepository.createChecklistTemplate({
      productType: dto.productType,
      name: dto.name,
      required: dto.required ?? true,
      order: dto.order ?? 0,
    });
  }

  async removeChecklistTemplate(id: string) {
    return this.documentsRepository.removeChecklistTemplate(id);
  }

  // â”€â”€ Links de upload (portal do cliente) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async generateUploadLink(claimId: string, dto: GenerateUploadLinkDto): Promise<UploadLinkItem> {
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    const link = await this.documentsRepository.createUploadLink(claimId, expiresAt);
    return this.toUploadLinkItem(link);
  }

  async listUploadLinks(claimId: string): Promise<UploadLinkItem[]> {
    const links = await this.documentsRepository.listUploadLinksByClaim(claimId);
    return links.map((l) => this.toUploadLinkItem(l));
  }

  private toUploadLinkItem(link: { id: string; token: string; expiresAt: Date | null; createdAt: Date }): UploadLinkItem {
    const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
    return {
      id: link.id,
      token: link.token,
      url: `${baseUrl}/portal/${link.token}`,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
    };
  }

  // â”€â”€ Portal pÃºblico (sem login) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async validateToken(token: string) {
    const link = await this.documentsRepository.findUploadLinkByToken(token);
    if (!link) throw new InvalidUploadLinkError();
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) throw new ExpiredUploadLinkError();
    return link;
  }

  async getPortalInfo(token: string): Promise<PortalClaimInfo> {
    const link = await this.validateToken(token);
    return {
      internalNumber: link.claim.internalNumber,
      clientName: link.claim.client.name,
      productType: link.claim.productType,
      checklist: link.claim.checklistItems.map(toChecklistItem),
      expiresAt: link.expiresAt?.toISOString() ?? null,
    };
  }

  async presignPortalUpload(token: string, dto: PresignUploadDto): Promise<PresignUploadResponse> {
    const link = await this.validateToken(token);
    const storageKey = this.storageService.buildStorageKey(link.claim.tenantId, link.claimId, dto.fileName);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(storageKey, dto.mimeType);
    return { uploadUrl, storageKey };
  }

  async confirmPortalUpload(
    token: string,
    dto: ConfirmUploadDto,
    ipAddress: string | undefined,
  ): Promise<DocumentItem> {
    const link = await this.validateToken(token);

    const doc = await this.documentsRepository.create({
      claimId: link.claimId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      storageKey: dto.storageKey,
      checklistItemId: dto.checklistItemId,
      uploadedByClient: true,
      ipAddress,
      geoLocation: dto.geoLocation,
    });
    if (!doc) throw new ClaimNotFoundForUploadError();

    if (dto.checklistItemId) {
      await this.documentsRepository.updateChecklistItemStatus(dto.checklistItemId, 'RECEIVED');
    }
    await this.documentsRepository.markUploadLinkUsed(link.id);

    this.broadcastUpload(doc.tenantId, link.claimId, doc);
    // Notifica a equipe interna (sino) que o CLIENTE enviou um documento pelo portal â€”
    // nÃ£o dispara e-mail para o prÃ³prio cliente aqui (ele jÃ¡ sabe, acabou de enviar).
    await this.notifyDocumentEvent(link.claimId, 'uploaded', doc.fileName);
    await this.ocrQueueService.enqueueIfEligible({
      tenantId: doc.tenantId,
      documentId: doc.id,
      storageKey: doc.storageKey,
      mimeType: doc.mimeType,
    });
    return toDocumentItem(doc);
  }

  private broadcastUpload(tenantId: string, claimId: string, doc: { id: string; fileName: string; uploadedByClient: boolean }) {
    this.realtimeGateway.broadcastToTenant(tenantId, 'document.uploaded', {
      claimId,
      documentId: doc.id,
      fileName: doc.fileName,
      uploadedByClient: doc.uploadedByClient,
    });
  }

  /** Monta o contexto e dispara a notificaÃ§Ã£o de evento de documento (Fase 10). */
  private async notifyDocumentEvent(
    claimId: string,
    kind: 'uploaded' | 'approved' | 'rejected' | 'pending',
    fileName: string,
  ): Promise<void> {
    const claim = await this.documentsRepository.getClaimNotificationContext(claimId);
    if (!claim) return; // nÃ£o deveria acontecer (documento sempre tem um claim vÃ¡lido), mas nÃ£o Ã© motivo para quebrar o upload

    const ctx: ClaimNotificationContext = {
      tenantId: claim.tenantId,
      claimId: claim.id,
      claimNumber: claim.internalNumber,
      clientName: claim.client.name,
      clientEmail: claim.client.email,
      assignedUserId: claim.assignedUserId,
    };
    await this.notificationsService.notifyDocumentEvent(ctx, kind, fileName);
  }
}


