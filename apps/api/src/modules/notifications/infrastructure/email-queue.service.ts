// @ts-nocheck
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { EMAIL_QUEUE_NAME, type EmailJobPayload } from '@seguros/schemas';
import type { Queue } from 'bullmq';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE_NAME) private readonly queue: Queue<EmailJobPayload>) {}

  async enqueue(payload: EmailJobPayload): Promise<void> {
    if (!payload.toEmail) return; // sem e-mail cadastrado (ex: cliente sem e-mail informado) — não é erro, só não há para quem mandar
    await this.queue.add('send-email', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 3600 }, // mantém 1h de histórico para debug, depois limpa
      removeOnFail: { age: 24 * 3600 }, // falhas ficam 24h (dead-letter informal) antes de limpar
    });
  }
}

