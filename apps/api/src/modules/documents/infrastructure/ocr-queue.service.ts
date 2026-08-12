// @ts-nocheck
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { OCR_QUEUE_NAME, type OcrJobPayload } from '@seguros/schemas';
import type { Queue } from 'bullmq';

const OCR_ELIGIBLE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

@Injectable()
export class OcrQueueService {
  constructor(@InjectQueue(OCR_QUEUE_NAME) private readonly queue: Queue<OcrJobPayload>) {}

  async enqueueIfEligible(payload: OcrJobPayload): Promise<void> {
    if (!OCR_ELIGIBLE_MIME_TYPES.includes(payload.mimeType)) return; // vídeo, DOCX, XLSX, ZIP etc. não passam por OCR
    await this.queue.add('process-ocr', payload, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 24 * 3600 },
    });
  }
}

