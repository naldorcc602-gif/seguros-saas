import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Cliente S3 mínimo, só para baixar o arquivo antes de rodar OCR. Não é o
 * mesmo StorageService da API (esse tem presigned URLs para upload/download
 * do navegador) — o worker só precisa ler os bytes do objeto, então um
 * client puro do SDK é suficiente e evita duplicar toda a abstração da API.
 */
const client = new S3Client({
  region: process.env.STORAGE_REGION || 'auto',
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.STORAGE_BUCKET ?? '';

export async function downloadObjectBuffer(storageKey: string): Promise<Buffer> {
  const result = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: storageKey }));
  const stream = result.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
