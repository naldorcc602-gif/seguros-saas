import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';

/**
 * Teste e2e do fluxo de autenticação de ponta a ponta: registra um tenant
 * novo, faz login, usa o access token numa rota protegida, e renova a
 * sessão via refresh token.
 *
 * REQUER um Postgres e um Redis reais, apontados por `DATABASE_URL` e
 * `REDIS_URL` — recomendo um banco de teste isolado (`seguros_saas_test`),
 * nunca o mesmo banco de desenvolvimento, já que este teste cria dados de
 * verdade. Rode com:
 *
 *   DATABASE_URL=postgresql://.../seguros_saas_test npm run test:e2e --workspace=@seguros/api
 *
 * Não foi possível executar este teste no ambiente de geração de código
 * (sem Postgres/Redis disponíveis) — validado apenas por checagem de
 * sintaxe/tipos. Rode localmente antes de confiar nele em CI.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  const uniqueEmail = `teste-e2e-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra um novo tenant + usuário Administrador', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register-tenant').send({
      tenantName: 'Corretora Teste E2E',
      adminName: 'Admin Teste',
      adminEmail: uniqueEmail,
      password: 'SenhaForte123!',
    });

    expect(response.status).toBe(201);
    expect(response.body.tenantId).toBeDefined();
    expect(response.body.userId).toBeDefined();
  });

  it('rejeita registro com e-mail duplicado', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register-tenant').send({
      tenantName: 'Outra Corretora',
      adminName: 'Outro Admin',
      adminEmail: uniqueEmail,
      password: 'SenhaForte123!',
    });

    expect(response.status).toBe(409);
  });

  it('faz login e recebe um par de tokens (2FA desativado por padrão)', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email: uniqueEmail,
      password: 'SenhaForte123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.requiresTwoFactor).toBe(false);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('rejeita login com senha errada', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email: uniqueEmail,
      password: 'senha-errada',
    });

    expect(response.status).toBe(401);
  });

  it('acessa uma rota protegida com o access token, e é rejeitado sem ele', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({
      email: uniqueEmail,
      password: 'SenhaForte123!',
    });
    const { accessToken } = login.body;

    const withToken = await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(withToken.status).toBe(200);

    const withoutToken = await request(app.getHttpServer()).get('/dashboard/summary');
    expect(withoutToken.status).toBe(401);
  });

  it('renova a sessão via refresh token, e o token antigo não pode ser reutilizado', async () => {
    const login = await request(app.getHttpServer()).post('/auth/login').send({
      email: uniqueEmail,
      password: 'SenhaForte123!',
    });
    const { refreshToken } = login.body;

    const refreshed = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();

    // Reuso do token antigo deve falhar (rotação/detecção de reuso)
    const reused = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });
    expect(reused.status).toBe(401);
  });

  it('/health responde sem autenticação', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
