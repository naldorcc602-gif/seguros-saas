import { Module } from '@nestjs/common';

import { OcrAiService } from './application/ocr-ai.service';
import { AiContextRepository } from './infrastructure/ai-context.repository';
import { AnthropicClientService } from './infrastructure/anthropic-client.service';
import { OcrAiController } from './presentation/ocr-ai.controller';

@Module({
  controllers: [OcrAiController],
  providers: [OcrAiService, AiContextRepository, AnthropicClientService],
})
export class OcrAiModule {}
