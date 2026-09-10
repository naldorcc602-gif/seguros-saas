import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicClientService {
  private readonly logger = new Logger(AnthropicClientService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.model = config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5-20250929';
    this.client = apiKey ? new Anthropic({ apiKey }) : null;

    if (!this.client) {
      this.logger.warn('ANTHROPIC_API_KEY não configurada — as funções de IA vão retornar um erro até isso ser definido no .env.');
    }
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'IA não configurada neste ambiente (ANTHROPIC_API_KEY ausente). Configure a chave no .env para usar estas funções.',
      );
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }
}
