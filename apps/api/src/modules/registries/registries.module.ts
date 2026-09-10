import { Module } from '@nestjs/common';

import { RegistriesService } from './application/registries.service';
import { RegistriesController } from './presentation/registries.controller';

@Module({
  controllers: [RegistriesController],
  providers: [RegistriesService],
})
export class RegistriesModule {}
