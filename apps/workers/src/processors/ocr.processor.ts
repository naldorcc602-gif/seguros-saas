import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@seguros/database';
import { OCR_QUEUE_NAME, extractAllFields, type OcrExtractedData, type OcrJobPayload } from '@seguros/schemas';
import { createWorker } from 'tesseract.js';

import { downloadObjectBuffer } from '../storage-client';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Extrai texto do arquivo antes de rodar os extratores por regex.
 *
 * - Imagens (foto de CNH/CRLV tirada pelo celular, o caso mais comum do
 *   escopo original): OCR de verdade via Tesseract.js, em português.
 * - PDF: tenta ler a camada de texto embutida (`pdf-parse`) — funciona bem
 *   para PDFs gerados digitalmente (ex: boletim de ocorrência emitido em
 *   PDF), mas NÃO faz OCR de PDF escaneado como imagem (isso exigiria
 *   converter cada página em imagem antes, uma dependência pesada a mais;
 *   fica documentado como limitação conhecida desta fase).
 * - Outros formatos (vídeo, DOCX, XLSX, ZIP): não processados, o job só
 *   retorna sem erro.
 */
async function extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
  if (IMAGE_MIME_TYPES.includes(mimeType)) {
    const worker = await createWorker('por');
    try {
      const { data } = await worker.recognize(buffer);
      return data.text;
    } finally {
      await worker.terminate();
    }
  }

  if (mimeType === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      return result.text;
    } catch {
      return null; // PDF provavelmente é uma imagem escaneada sem camada de texto — ver limitação acima
    }
  }

  return null;
}

export function startOcrWorker(): Worker<OcrJobPayload> {
  const worker = new Worker<OcrJobPayload>(
    OCR_QUEUE_NAME,
    async (job) => {
      const { documentId, storageKey, mimeType } = job.data;

      const buffer = await downloadObjectBuffer(storageKey);
      const text = await extractText(buffer, mimeType);

      if (!text || text.trim().length === 0) {
        console.log(`[ocr-worker] Nenhum texto extraído para o documento ${documentId} (mimeType: ${mimeType}).`);
        return;
      }

      const fields = extractAllFields(text);
      const extracted: OcrExtractedData = {
        processedAt: new Date().toISOString(),
        rawTextPreview: text.slice(0, 500),
        fields: fields as OcrExtractedData['fields'],
      };

      await prisma.document.updateMany({
        where: { id: documentId },
        data: { ocrExtractedData: extracted as never },
      });

      console.log(
        `[ocr-worker] Documento ${documentId} processado — campos encontrados: ${Object.keys(fields).join(', ') || 'nenhum'}.`,
      );
    },
    { connection, concurrency: 2 }, // OCR é pesado de CPU — concorrência baixa de propósito
  );

  worker.on('failed', (job, err) => {
    console.error(`[ocr-worker] Job ${job?.id} falhou:`, err.message);
  });

  return worker;
}
