// @ts-nocheck
import { Module } from '@nestjs/common';
import { join } from 'path';
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
 * MÃ³dulo raiz.
 *
 * Os mÃ³dulos de domÃ­nio (ClaimsModule, DocumentsModule, AuthModule, etc.)
 * jÃ¡ tÃªm suas pastas reservadas em `src/modules/*` seguindo Clean Architecture
 * (domain / application / infrastructure / presentation) e serÃ£o registrados
 * aqui conforme cada fase do roadmap for implementada:
 *   - AuthModule        -> âœ… Fase 5 (implementado)
 *   - DashboardModule    -> âœ… Fase 6 (implementado)
 *   - ClaimsModule       -> âœ… Fase 7 (Kanban) + Fase 8 (cadastro completo)
 *   - RegistriesModule   -> âœ… Fase 8 (cadastros auxiliares: seguradoras, corretores, clientes, peritos, oficinas, despachantes, advogados)
 *   - DocumentsModule    -> âœ… Fase 9 (upload S3/R2, checklist, portal pÃºblico do cliente)
 *   - NotificationsModule-> âœ… Fase 10 (in-app + e-mail, fila BullMQ, SLA/prazo agendado)
 *   - OcrAiModule        -> âœ… Fase 11 (OCR via worker + IA sÃ­ncrona via Anthropic)
 *   - ReportsModule      -> âœ… Fase 12 (tempo mÃ©dio, SLA, financeiro, produtividade, documentos pendentes + exportaÃ§Ã£o PDF/Excel/CSV)
 *   - FinancialModule    -> (parte do escopo financeiro, absorvida pelo ReportsModule + FinancialEntry jÃ¡ existente)
 *   - AuditModule        -> cross-cutting, ativado a partir do AuthModule (guards jÃ¡ emitem contexto)
 *
 * Nota de arquitetura (Fase 10): o gateway WebSocket (antes dentro de
 * ClaimsModule) foi extraÃ­do para `shared/realtime` porque NotificationsModule
 * precisava dele e, ao mesmo tempo, precisava ser importado POR ClaimsModule/
 * DocumentsModule (para disparar notificaÃ§Ãµes) â€” ver shared/realtime/realtime.module.ts.
 *
 * Nota de arquitetura (Fase 11/12): assim como Documents/Notifications,
 * OcrAiModule e ReportsModule NÃƒO importam ClaimsModule â€” montam seu prÃ³prio
 * contexto de leitura direto via Prisma.
 *
 * Nota de seguranÃ§a (Fase 16 â€” hardening de produÃ§Ã£o): ThrottlerModule Ã©
 * global (rate limit padrÃ£o para toda a API); os endpoints de login/2FA tÃªm
 * limites mais estritos via @Throttle() no AuthController, jÃ¡ que sÃ£o o
 * alvo mais comum de forÃ§a bruta.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../.env'),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minuto
        limit: 100, // 100 requisiÃ§Ãµes/minuto por IP â€” generoso o bastante para uso normal do app
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


