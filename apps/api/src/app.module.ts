import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OcrAiModule } from './modules/ocr-ai/ocr-ai.module';
import { RegistriesModule } from './modules/registries/registries.module';
import { ReportsModule } from './modules/reports/reports.module';

/**
 * Módulo raiz.
 *
 * Os módulos de domínio (ClaimsModule, DocumentsModule, AuthModule, etc.)
 * já têm suas pastas reservadas em `src/modules/*` seguindo Clean Architecture
 * (domain / application / infrastructure / presentation) e serão registrados
 * aqui conforme cada fase do roadmap for implementada:
 *   - AuthModule        -> ✅ Fase 5 (implementado)
 *   - DashboardModule    -> ✅ Fase 6 (implementado)
 *   - ClaimsModule       -> ✅ Fase 7 (Kanban) + Fase 8 (cadastro completo)
 *   - RegistriesModule   -> ✅ Fase 8 (cadastros auxiliares: seguradoras, corretores, clientes, peritos, oficinas, despachantes, advogados)
 *   - DocumentsModule    -> ✅ Fase 9 (upload S3/R2, checklist, portal público do cliente)
 *   - NotificationsModule-> ✅ Fase 10 (in-app + e-mail, fila BullMQ, SLA/prazo agendado)
 *   - OcrAiModule        -> ✅ Fase 11 (OCR via worker + IA síncrona via Anthropic)
 *   - ReportsModule      -> ✅ Fase 12 (tempo médio, SLA, financeiro, produtividade, documentos pendentes + exportação PDF/Excel/CSV)
 *   - FinancialModule    -> (parte do escopo financeiro, absorvida pelo ReportsModule + FinancialEntry já existente)
 *   - AuditModule        -> cross-cutting, ativado a partir do AuthModule (guards já emitem contexto)
 *
 * Nota de arquitetura (Fase 10): o gateway WebSocket (antes dentro de
 * ClaimsModule) foi extraído para `shared/realtime` porque NotificationsModule
 * precisava dele e, ao mesmo tempo, precisava ser importado POR ClaimsModule/
 * DocumentsModule (para disparar notificações) — ver shared/realtime/realtime.module.ts.
 *
 * Nota de arquitetura (Fase 11/12): assim como Documents/Notifications,
 * OcrAiModule e ReportsModule NÃO importam ClaimsModule — montam seu próprio
 * contexto de leitura direto via Prisma.
 *
 * Nota de segurança (Fase 16 — hardening de produção): ThrottlerModule é
 * global (rate limit padrão para toda a API); os endpoints de login/2FA têm
 * limites mais estritos via @Throttle() no AuthController, já que são o
 * alvo mais comum de força bruta.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minuto
        limit: 100, // 100 requisições/minuto por IP — generoso o bastante para uso normal do app
      },
    ]),
    AuthModule,
    DashboardModule,
    NotificationsModule,
    ClaimsModule,
    RegistriesModule,
    DocumentsModule,
    OcrAiModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
