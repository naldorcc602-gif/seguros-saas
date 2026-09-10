import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApplyOcrFieldDto, AiRequestDto } from '../application/dto';
import { OcrAiService } from '../application/ocr-ai.service';

@ApiTags('ocr-ai')
@ApiBearerAuth('access-token')
@Controller('claims/:claimId/ai')
export class OcrAiController {
  constructor(private readonly ocrAiService: OcrAiService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiParam({ name: 'claimId' })
  @ApiOperation({
    summary: 'Executa uma das 8 ações de IA sobre o sinistro',
    description:
      'Ações: `summary`, `missing_documents`, `inconsistencies`, `next_steps`, `technical_opinion`, `history_summary`, ' +
      '`email_draft` (exige `emailPurpose`), `ask` (exige `question`). Todo conteúdo gerado é uma minuta — precisa de revisão humana.',
  })
  @ApiResponse({ status: 200, description: 'Texto gerado pela IA.' })
  @ApiResponse({ status: 400, description: 'Ação inválida, ou faltou `question`/`emailPurpose` quando exigido.' })
  @ApiResponse({ status: 500, description: 'ANTHROPIC_API_KEY não configurada neste ambiente.' })
  run(@Param('claimId') claimId: string, @Body() dto: AiRequestDto) {
    return this.ocrAiService.run(claimId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('apply-ocr-field')
  @ApiParam({ name: 'claimId' })
  @ApiOperation({
    summary: 'Aplica um valor extraído por OCR ao cadastro (ação deliberada do regulador)',
    description: 'Alvos aceitos: vehiclePlate, renavam, chassis, vehicleModel (no sinistro) ou clientDocument, clientName (no cliente).',
  })
  applyOcrField(@Param('claimId') claimId: string, @Body() dto: ApplyOcrFieldDto) {
    return this.ocrAiService.applyOcrField(claimId, dto.targetField, dto.value);
  }
}
