// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutos — tempo suficiente para um upload/download começar

/**
 * Abstração de armazenamento de arquivos. Funciona tanto com Amazon S3
 * quanto com Cloudflare R2 (ambos falam a API S3), trocando apenas o
 * `STORAGE_ENDPOINT` e `STORAGE_REGION` no .env — nenhuma mudança de código.
 *
 * Padrão adotado: o back-end NUNCA recebe o arquivo em si (nada de multipart
 * no NestJS). Em vez disso:
 *   1. O cliente pede uma URL pré-assinada de PUT (`getPresignedUploadUrl`).
 *   2. O navegador faz o upload DIRETO para o S3/R2 usando essa URL.
 *   3. O cliente confirma para a API que o upload terminou (registra metadados).
 * Isso evita que arquivos grandes (vídeos de vistoria) passem pela memória
 * do servidor Node, e escala melhor sob muitos uploads simultâneos.
 *
 * Documentos são sensíveis (CNH, boletim de ocorrência, laudos) — por isso
 * o bucket NUNCA é público e todo download também usa URL pré-assinada
 * (`getPresignedDownloadUrl`), nunca uma URL pública direta.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('STORAGE_ENDPOINT');
    this.bucket = this.config.get<string>('STORAGE_BUCKET') ?? '';

    this.client = new S3Client({
      region: this.config.get<string>('STORAGE_REGION') ?? 'auto',
      endpoint: endpoint || undefined, // undefined = usa o endpoint padrão da AWS (S3 real); definido = R2 ou S3-compatível
      forcePathStyle: !!endpoint, // R2 e outros compatíveis geralmente precisam de path-style
      credentials: {
        accessKeyId: this.config.get<string>('STORAGE_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('STORAGE_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  /** Gera uma chave de objeto organizada por tenant/sinistro, com um UUID para evitar colisão de nomes. */
  buildStorageKey(tenantId: string, claimId: string, originalFileName: string): string {
    const safeName = originalFileName.replace(/[^\w.\-]/g, '_');
    return `tenants/${tenantId}/claims/${claimId}/${randomUUID()}-${safeName}`;
  }

  async getPresignedUploadUrl(storageKey: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: mimeType });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
  }

  async getPresignedDownloadUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: storageKey });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS });
  }

  /**
   * Exposto para uso futuro (ex: expurgo de versões antigas além de uma
   * política de retenção) — NÃO é chamado por nenhum endpoint hoje, já que
   * o escopo original pede para nunca perder documentos enviados.
   */
  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }
}

