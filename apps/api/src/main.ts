// @ts-nocheck
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

/**
 * Entrypoint da API.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Helmet (Fase 16 — hardening de produção): cabeçalhos de segurança
  // padrão (X-Frame-Options, X-Content-Type-Options, etc.). CSP fica
  // desativado aqui de propósito — a API não serve HTML/assets (isso é
  // responsabilidade do Next.js), então uma CSP genérica só atrapalharia
  // sem proteger nada; o front-end é quem deveria ter sua própria CSP.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: config.get<string>('APP_BASE_URL') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (Fase 16 — hardening de produção): desativado por padrão em
  // produção (NODE_ENV=production), a menos que SWAGGER_ENABLED=true seja
  // definido explicitamente. Documentação da API pública em texto puro
  // facilita reconhecimento de superfície de ataque; em homologação e
  // desenvolvimento fica sempre ligado.
  const swaggerEnabled = config.get<string>('NODE_ENV') !== 'production' || config.get<string>('SWAGGER_ENABLED') === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API — Regulação de Sinistros')
      .setDescription(
        'API REST do sistema de regulação e gestão de sinistros. ' +
          'A maioria das rotas exige um access token JWT (`Authorization: Bearer <token>`), obtido via `POST /auth/login`. ' +
          'Rotas do portal público do cliente (`/portal/:token`) e de autenticação inicial (`/auth/login`, `/auth/register-tenant`, ' +
          '`/auth/refresh`) são as únicas exceções e não exigem token.\n\n' +
          '### Multi-tenancy\n' +
          'Todo dado é isolado por tenant automaticamente a partir do token — não existe parâmetro de tenant nas rotas.\n\n' +
          '### Erros\n' +
          'Erros seguem o formato padrão do NestJS: `{ "statusCode": number, "message": string | string[], "error": string }`.',
      )
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('auth', 'Login, 2FA, refresh token e registro de tenant')
      .addTag('dashboard', 'Indicadores em tempo real (Fase 6)')
      .addTag('claims', 'Sinistros — Kanban (Fase 7) e cadastro completo (Fase 8)')
      .addTag('registries', 'Cadastros auxiliares: seguradoras, corretores, clientes, peritos, oficinas, despachantes, advogados')
      .addTag('documents', 'Upload, checklist e versionamento de documentos (Fase 9)')
      .addTag('portal', 'Portal público do cliente — sem autenticação (Fase 9)')
      .addTag('notifications', 'Sino de notificações e modelos de e-mail (Fase 10)')
      .addTag('ocr-ai', 'Extração de dados (OCR) e assistente de IA (Fase 11)')
      .addTag('reports', 'Relatórios gerenciais e exportação PDF/Excel/CSV (Fase 12)')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
    });
  }

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();

