// @ts-nocheck
/**
 * Schemas Zod do domínio (ex: createClaimSchema, uploadDocumentSchema).
 * Serão adicionados a partir da Fase 8 (Cadastro de sinistros), um arquivo
 * por bounded context: claim.schema.ts, document.schema.ts, auth.schema.ts, etc.
 */
export * from './dashboard.schema';
export * from './claim.schema';
export * from './claim-detail.schema';
export * from './registry.schema';
export * from './document.schema';
export * from './notification.schema';
export * from './template-render';
export * from './ocr-ai.schema';
export * from './ocr-extractors';
export * from './reports.schema';
