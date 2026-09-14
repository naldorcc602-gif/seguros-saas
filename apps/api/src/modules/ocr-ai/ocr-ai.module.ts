import { Module } from '@nestjs/common';

import { OcrAiService } from './application/ocr-ai.service';
import { AiContextRepository } from './infrastructure/ai-context.repository';
import { AiClientService } from './infrastructure/ai-client.service';
import { OcrAiController } from './presentation/ocr-ai.controller';

@Module({
  controllers: [OcrAiController],
  providers: [OcrAiService, AiContextRepository, AiClientService],
})
export class OcrAiModule {}
