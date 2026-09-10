import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@seguros/database';
import { EMAIL_QUEUE_NAME, renderTemplateString, type EmailJobPayload } from '@seguros/schemas';

import { createMailTransport, MAIL_FROM } from '../mailer';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // exigido pelo BullMQ para workers de longa duração
});

const transport = createMailTransport();

export function startEmailWorker(): Worker<EmailJobPayload> {
  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { tenantId, claimId, templateKey, toEmail, variables } = job.data;

      const template = await prisma.emailTemplate.findFirst({ where: { key: templateKey, tenantId } });
      if (!template) {
        console.warn(`[email-worker] Template "${templateKey}" não encontrado para o tenant ${tenantId} — pulando.`);
        return;
      }

      const subject = renderTemplateString(template.subject, variables);
      const bodyHtml = renderTemplateString(template.bodyHtml, variables);

      if (transport) {
        await transport.sendMail({ from: MAIL_FROM, to: toEmail, subject, html: bodyHtml });
      } else {
        console.log(`[email-worker] (modo log, sem SMTP configurado) Para: ${toEmail} | Assunto: ${subject}`);
      }

      // Registra no histórico de comunicação do sinistro (requisito do escopo:
      // "Registrar: E-mails enviados... Todos vinculados ao sinistro").
      await prisma.communication.create({
        data: {
          tenantId,
          claimId,
          channel: 'EMAIL',
          direction: 'OUTBOUND',
          subject,
          content: bodyHtml,
        },
      });
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    console.error(`[email-worker] Job ${job?.id} falhou:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[email-worker] E-mail enviado (job ${job.id}) para ${job.data.toEmail}`);
  });

  return worker;
}
