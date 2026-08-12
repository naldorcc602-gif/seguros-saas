// @ts-nocheck
// Mock de @seguros/database para testes unitários — evita depender do
// Prisma Client gerado (que exige `prisma generate` com acesso à internet
// para baixar os engines, indisponível neste ambiente de testes). Serviços
// testados aqui recebem seus repositórios mockados diretamente; este stub
// só existe para satisfazer a resolução de módulo do TypeScript/Jest.
export const prisma = {} as never;
export const getCurrentTenantId = jest.fn(() => 'tenant-test-id');
export const getCurrentUserId = jest.fn(() => 'user-test-id');
export const requestContextStorage = { run: (_ctx: unknown, cb: () => unknown) => cb(), getStore: () => undefined };

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  ADJUSTER = 'ADJUSTER',
  ASSISTANT = 'ASSISTANT',
  BROKER = 'BROKER',
  CLIENT = 'CLIENT',
}

