// @ts-nocheck
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { KanbanRealtimeEvents } from '@seguros/schemas';
import type { Server, Socket } from 'socket.io';

/**
 * Gateway de tempo real único da aplicação (Kanban, Documentos, Notificações
 * — qualquer módulo que precise avisar o front-end ao vivo). Vivia dentro do
 * ClaimsModule até a Fase 10; foi extraído para `shared/realtime` porque o
 * NotificationsModule precisava dele e também precisava ser importado POR
 * ClaimsModule/DocumentsModule (para disparar notificações a partir de
 * eventos de sinistro/documento) — importar o gateway de dentro do
 * ClaimsModule teria criado um ciclo Claims -> Notifications -> Claims.
 *
 * Cada socket, ao conectar, autentica com o MESMO access token JWT usado nas
 * chamadas REST (enviado via `handshake.auth.token`, não como query string,
 * para não vazar em logs de proxy) e entra na sala `tenant:<tenantId>` — o
 * isolamento entre tenants aqui é por sala, não por banco, então cuidado ao
 * adicionar novos eventos: sempre emitir para `tenant:<tenantId>`, nunca em
 * broadcast global.
 *
 * O tipo `KanbanRealtimeEvents` manteve esse nome por razões históricas (foi
 * criado na Fase 7, só para o Kanban) mas hoje cobre todos os eventos de
 * tempo real da aplicação — renomear é só uma questão de cosmética de
 * código, não afeta o comportamento.
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: process.env.APP_BASE_URL ?? 'http://localhost:3000', credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('Token ausente.');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      await client.join(`tenant:${payload.tenantId}`);
      await client.join(`user:${payload.sub}`);
      this.logger.debug(`Socket ${client.id} conectado ao tenant ${payload.tenantId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} desconectado`);
  }

  broadcastToTenant<E extends keyof KanbanRealtimeEvents>(
    tenantId: string,
    event: E,
    payload: KanbanRealtimeEvents[E],
  ) {
    this.server.to(`tenant:${tenantId}`).emit(event, payload);
  }

  /** Envia um evento só para um usuário específico (ex: sino de notificação), não para o tenant inteiro. */
  emitToUser<E extends keyof KanbanRealtimeEvents>(userId: string, event: E, payload: KanbanRealtimeEvents[E]) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}

