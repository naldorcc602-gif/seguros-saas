// @ts-nocheck
/**
 * Entrypoint dos workers assíncronos.
 *
 * Filas ativas:
 *  - email-queue        -> ✅ Fase 10 (envio de e-mails transacionais via SMTP)
 *  - ocr-queue           -> ✅ Fase 11 (extração de dados de documentos)
 *
 * Filas planejadas (fases futuras):
 *  - whatsapp-queue      -> envio via WhatsApp Business API
 *  - webhook-queue       -> disparo de webhooks configurados por tenant
 *
 * As funções de IA (resumo, parecer técnico, respostas a perguntas) NÃO
 * rodam aqui — são chamadas síncronas feitas diretamente pela API
 * (apps/api/src/modules/ocr-ai), porque o regulador espera a resposta na
 * tela na hora, ao contrário do OCR/e-mail que rodam em segundo plano.
 */
import { startEmailWorker } from './processors/email.processor';
import { startOcrWorker } from './processors/ocr.processor';

const emailWorker = startEmailWorker();
const ocrWorker = startOcrWorker();
console.log('[workers] email-worker e ocr-worker rodando, aguardando jobs...');

process.on('SIGTERM', async () => {
  console.log('[workers] Encerrando graciosamente...');
  await Promise.all([emailWorker.close(), ocrWorker.close()]);
  process.exit(0);
});

