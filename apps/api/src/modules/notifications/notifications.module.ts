import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EMAIL_QUEUE_NAME } from '@seguros/schemas';

import { RealtimeModule } from '../../shared/realtime/realtime.module';
import { EmailTemplatesService } from './application/email-templates.service';
import { NotificationsService } from './application/notifications.service';
import { EmailQueueService } from './infrastructure/email-queue.service';
import { EmailTemplatesRepository, NotificationsRepository } from './infrastructure/notifications.repository';
import { SlaCheckScheduler } from './infrastructure/sla-check.scheduler';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [
    RealtimeModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueueAsync({
      name: EMAIL_QUEUE_NAME,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379' },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailTemplatesService,
    NotificationsRepository,
    EmailTemplatesRepository,
    EmailQueueService,
    SlaCheckScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
