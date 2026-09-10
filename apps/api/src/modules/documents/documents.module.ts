import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OCR_QUEUE_NAME } from '@seguros/schemas';

import { RealtimeModule } from '../../shared/realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsService } from './application/documents.service';
import { DocumentsRepository } from './infrastructure/documents.repository';
import { OcrQueueService } from './infrastructure/ocr-queue.service';
import { StorageService } from './infrastructure/storage.service';
import { DocumentsController } from './presentation/documents.controller';
import { PortalController } from './presentation/portal.controller';

@Module({
  imports: [
    RealtimeModule, // antes vinha via ClaimsModule; extraído na Fase 10 (ver app.module.ts)
    NotificationsModule, // DocumentsService dispara notificações (documento enviado/aprovado/rejeitado)
    BullModule.registerQueueAsync({
      name: OCR_QUEUE_NAME,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379' },
      }),
    }),
  ],
  controllers: [DocumentsController, PortalController],
  providers: [DocumentsService, DocumentsRepository, StorageService, OcrQueueService],
})
export class DocumentsModule {}
