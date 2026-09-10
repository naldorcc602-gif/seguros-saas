import { Injectable } from '@nestjs/common';
import { getCurrentTenantId, prisma } from '@seguros/database';
import { randomBytes } from 'node:crypto';

export interface CreateDocumentData {
  claimId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checklistItemId?: string;
  uploadedByUserId?: string;
  uploadedByClient: boolean;
  ipAddress?: string;
  geoLocation?: string;
}

const documentInclude = {
  versions: true,
  uploadedByUser: { select: { name: true } },
} as const;

@Injectable()
export class DocumentsRepository {
  listByClaim(claimId: string) {
    return prisma.document.findMany({
      where: { claimId },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return prisma.document.findFirst({ where: { id }, include: documentInclude });
  }

  async create(data: CreateDocumentData) {
    const contextTenantId = getCurrentTenantId();

    // Claim É filtrado por tenant pela extensão do Prisma quando há contexto
    // (upload autenticado) — isso já garante que só enxergamos o claim se for
    // do nosso tenant. No fluxo do portal público (sem login) NÃO há
    // contexto de tenant; nesse caso usamos o tenantId do próprio claim
    // encontrado — a posse já foi validada antes pelo token do link de
    // upload (ver DocumentsService/UploadLink), não por este método.
    const claim = await prisma.claim.findFirst({ where: { id: data.claimId }, select: { id: true, tenantId: true } });
    if (!claim) return null;
    const tenantId = contextTenantId ?? claim.tenantId;

    if (data.checklistItemId) {
      const checklistItem = await prisma.claimChecklistItem.findFirst({
        where: { id: data.checklistItemId, claimId: data.claimId },
        select: { id: true },
      });
      if (!checklistItem) return null;
    }

    return prisma.document.create({
      data: {
        tenantId,
        claimId: data.claimId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: data.storageKey,
        checklistItemId: data.checklistItemId,
        uploadedByUserId: data.uploadedByUserId,
        uploadedByClient: data.uploadedByClient,
        ipAddress: data.ipAddress,
        geoLocation: data.geoLocation,
        status: 'RECEIVED',
      },
      include: documentInclude,
    });
  }

  /** Nova versão de um documento já existente (ex: cliente reenvia uma CNH legível). */
  async addVersion(documentId: string, storageKey: string, uploadedByUserId: string | undefined) {
    // findFirst em Document É filtrado por tenant pela extensão do Prisma —
    // confirmamos que o documento pertence ao tenant atual ANTES de criar
    // qualquer registro, para não deixar uma DocumentVersion órfã no ar caso
    // o documentId pertença a outro tenant.
    const existing = await prisma.document.findFirst({ where: { id: documentId } });
    if (!existing) return null;

    await prisma.documentVersion.create({
      data: { documentId, storageKey, versionNumber: await this.nextVersionNumber(documentId), uploadedByUserId },
    });
    await prisma.document.updateMany({
      where: { id: documentId },
      data: { storageKey, status: 'RECEIVED' },
    });
    return prisma.document.findFirst({ where: { id: documentId }, include: documentInclude });
  }

  private async nextVersionNumber(documentId: string): Promise<number> {
    const count = await prisma.documentVersion.count({ where: { documentId } });
    return count + 1;
  }

  async updateStatus(id: string, status: string) {
    const result = await prisma.document.updateMany({ where: { id }, data: { status: status as never } });
    if (result.count === 0) return null;
    return prisma.document.findFirst({ where: { id }, include: documentInclude });
  }

  // ── Checklist ──────────────────────────────────────────────────────
  listChecklistByClaim(claimId: string) {
    return prisma.claimChecklistItem.findMany({
      where: { claimId },
      include: { documents: { include: documentInclude } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateChecklistItemStatus(itemId: string, status: string) {
    const tenantId = getCurrentTenantId();

    // ClaimChecklistItem não tem coluna `tenantId` própria (herda o isolamento
    // via Claim.tenantId) — por isso NÃO está na lista de modelos interceptados
    // pela extensão de tenant do Prisma. Sem esta validação explícita, alguém
    // de outro tenant que soubesse/adivinhasse o `itemId` poderia alterar o
    // status de um checklist que não é seu. Confirmamos a posse via join antes
    // de escrever.
    const owned = await prisma.claimChecklistItem.findFirst({
      where: { id: itemId, claim: { tenantId } },
      select: { id: true },
    });
    if (!owned) return null;

    await prisma.claimChecklistItem.update({ where: { id: itemId }, data: { status: status as never } });
    return prisma.claimChecklistItem.findFirst({
      where: { id: itemId },
      include: { documents: { include: documentInclude } },
    });
  }

  listChecklistTemplates(productType?: string) {
    return prisma.checklistTemplateItem.findMany({
      where: productType ? { productType: productType as never } : undefined,
      orderBy: [{ productType: 'asc' }, { order: 'asc' }],
    });
  }

  createChecklistTemplate(data: { productType: string; name: string; required: boolean; order: number }) {
    const tenantId = getCurrentTenantId();
    return prisma.checklistTemplateItem.create({ data: { tenantId: tenantId!, ...data } as never });
  }

  async removeChecklistTemplate(id: string) {
    const result = await prisma.checklistTemplateItem.deleteMany({ where: { id } });
    return result.count > 0;
  }

  // ── Links de upload (portal do cliente) ─────────────────────────────
  createUploadLink(claimId: string, expiresAt: Date | null) {
    const token = randomBytes(24).toString('hex');
    return prisma.uploadLink.create({ data: { claimId, token, expiresAt } });
  }

  listUploadLinksByClaim(claimId: string) {
    return prisma.uploadLink.findMany({ where: { claimId }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Busca por token NÃO passa pelo filtro de tenant (é usada pelo portal
   * público, sem autenticação — não há contexto de tenant ainda nesse ponto).
   * O próprio token, sendo um segredo aleatório de 24 bytes, é o mecanismo
   * de controle de acesso aqui, não o isolamento por tenant.
   */
  findUploadLinkByToken(token: string) {
    return prisma.uploadLink.findFirst({
      where: { token },
      include: {
        claim: {
          include: {
            client: { select: { name: true, email: true } },
            checklistItems: { include: { documents: { include: documentInclude } } },
          },
        },
      },
    });
  }

  markUploadLinkUsed(id: string) {
    return prisma.uploadLink.update({ where: { id }, data: { used: true } });
  }

  /**
   * Busca os dados mínimos para montar um `ClaimNotificationContext`
   * (ver notifications/domain/notification-context.ts). Consulta direta ao
   * Prisma em vez de reaproveitar ClaimsRepository — DocumentsModule não
   * importa ClaimsModule (só o gateway compartilhado e o NotificationsModule),
   * então cada módulo resolve o próprio contexto de notificação localmente.
   */
  async getClaimNotificationContext(claimId: string) {
    return prisma.claim.findFirst({
      where: { id: claimId },
      select: {
        id: true,
        tenantId: true,
        internalNumber: true,
        assignedUserId: true,
        client: { select: { name: true, email: true } },
      },
    });
  }
}
