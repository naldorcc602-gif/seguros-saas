/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/*.dto.ts',
    '!**/*.module.ts',
    '!main.ts',
  ],
  moduleNameMapper: {
    // @seguros/schemas é um pacote-fonte puro (Zod), então apontamos direto
    // para o TypeScript-fonte em vez de exigir um build prévio do workspace.
    '^@seguros/schemas$': '<rootDir>/../../../packages/schemas/src/index.ts',
    // @seguros/database exige o Prisma Client gerado (`prisma generate`).
    // Testes unitários não devem depender de um banco de verdade — cada
    // service é testado com seu repositório mockado; este stub só existe
    // para satisfazer a resolução de módulo de arquivos que importam
    // '@seguros/database' transitivamente (ex: tipos, getCurrentTenantId).
    '^@seguros/database$': '<rootDir>/__mocks__/@seguros/database.ts',
    // bcrypt/otplib/qrcode têm custo real (hashing, geração de QR) que não
    // agrega nada a um teste unitário e, no caso do bcrypt, exige compilar
    // um binding nativo — mockados para os testes rodarem rápido e sem
    // dependências de build nativas.
    '^bcrypt$': '<rootDir>/__mocks__/bcrypt.ts',
    '^otplib$': '<rootDir>/__mocks__/otplib.ts',
    '^qrcode$': '<rootDir>/__mocks__/qrcode.ts',
  },
};
