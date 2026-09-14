import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

type AiProvider = 'anthropic' | 'openai';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly provider: AiProvider | null;

  constructor(private readonly config: ConfigService) {
    this.provider = this.resolveProvider();

    if (!this.provider) {
      this.logger.warn(
        'Nenhuma chave de IA configurada (ANTHROPIC_API_KEY ou OPENAI_API_KEY) — as funções de IA vão retornar um erro até isso ser definido no .env.',
      );
    }
  }

  /**
   * Escolhe o provedor de IA. A ordem de precedência:
   * `AI_PROVIDER` explícito no .env → chave existente (ANTHROPIC primeiro) → nenhum.
   * `openai` aceita qualquer API compatível com `/chat/completions` via
   * `OPENAI_BASE_URL` (OpenAI, DeepSeek, Ollama, LM Studio etc.), então dá para
   * trocar de provedor só mudando a configuração — o restante do sistema (prompts,
   * endpoint e UI) não muda.
   */
  private resolveProvider(): AiProvider | null {
    const explicit = this.config.get<string>('AI_PROVIDER');
    if (explicit === 'anthropic' || explicit === 'openai') return explicit;
    if (this.config.get<string>('ANTHROPIC_API_KEY')) return 'anthropic';
    if (this.config.get<string>('OPENAI_API_KEY')) return 'openai';
    return null;
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.provider) {
      throw new InternalServerErrorException(
        'IA não configurada neste ambiente. Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no .env para usar estas funções.',
      );
    }

    return this.provider === 'anthropic'
      ? this.completeAnthropic(systemPrompt, userPrompt)
      : this.completeOpenAi(systemPrompt, userPrompt);
  }

  private async completeAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    const model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5-20250929';
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  private async completeOpenAi(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY não configurada — defina a chave do provedor (ou use ANTHROPIC_API_KEY) no .env.',
      );
    }

    const baseUrl = (this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await response.json().catch(() => null)) as any;

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Falha ao chamar a API de IA (HTTP ${response.status})${body?.error?.message ? `: ${body.error.message}` : ''.trim()}`,
      );
    }

    return body?.choices?.[0]?.message?.content?.trim() ?? '';
  }
}