import { Module } from '@nestjs/common';

import { RealtimeModule } from '../../shared/realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimsService } from './application/claims.service';
import { ClaimsRepository } from './infrastructure/claims.repository';
import { ClaimsController } from './presentation/claims.controller';

@Module({
  imports: [
    RealtimeModule,
    NotificationsModule, // ClaimsService dispara notificações (novo sinistro, mudança de etapa)
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsRepository],
})
export class ClaimsModule {}
