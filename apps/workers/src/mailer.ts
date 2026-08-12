// @ts-nocheck
import nodemailer from 'nodemailer';

/**
 * Transporte único, reaproveitado por todos os envios do processo.
 * Mesma configuração SMTP do `.env` usada pela API (compartilhada via
 * docker-compose) — se `SMTP_HOST` não estiver definido, os e-mails são
 * logados no console em vez de enviados de verdade (útil em desenvolvimento
 * sem um servidor SMTP configurado).
 */
export function createMailTransport() {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.warn(
      '[mailer] SMTP_HOST não definido — e-mails serão apenas logados no console, não enviados de verdade.',
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

export const MAIL_FROM = process.env.SMTP_FROM ?? 'naoresponda@seudominio.com';

