// @ts-nocheck
import { ConflictException } from '@nestjs/common';
import { prisma } from '@seguros/database';

export type RegistryModelKey = 'insurer' | 'broker' | 'client' | 'adjuster' | 'workshop' | 'dispatcher' | 'lawyer';

/**
 * CRUD genérico para os cadastros auxiliares (Insurer, Broker, Client,
 * Adjuster, Workshop, Dispatcher, Lawyer) — todos compartilham o mesmo
 * formato de operação (listar, criar, atualizar, remover) e todos são
 * modelos tenant-scoped, então a extensão de multi-tenancy do Prisma já
 * cuida do isolamento em list/create/update/remove.
 *
 * NÃO é injetável via Nest DI (não é @Injectable()) de propósito — é
 * instanciado diretamente pelo RegistriesService, um por entidade, porque o
 * "modelo" (qual tabela) é um parâmetro de construção, não uma dependência.
 *
 * Limitação conhecida: `update`/`remove` fazem uma segunda consulta
 * (findFirst) após o updateMany/deleteMany para poder retornar o registro
 * atualizado — um pouco menos eficiente que um update() direto, mas é o
 * preço de manter o isolamento automático de tenant (ver nota equivalente
 * em ClaimsRepository.updateStage, Fase 7).
 */
export class RegistryCrudRepository<T> {
  constructor(private readonly model: RegistryModelKey) {}

  private get delegate(): any {
    return (prisma as any)[this.model];
  }

  list(): Promise<T[]> {
    return this.delegate.findMany({ orderBy: { name: 'asc' } });
  }

  create(data: Record<string, unknown>): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: Record<string, unknown>): Promise<T | null> {
    const result = await this.delegate.updateMany({ where: { id }, data });
    if (result.count === 0) return null;
    return this.delegate.findFirst({ where: { id } });
  }

  async remove(id: string): Promise<boolean> {
    try {
      const result = await this.delegate.deleteMany({ where: { id } });
      return result.count > 0;
    } catch (error: any) {
      // P2003/P2014 = violação de chave estrangeira (Postgres via Prisma) —
      // significa que este cadastro está referenciado por algum sinistro
      // (ex: um cliente com sinistros abertos). Em vez de deixar vazar um
      // erro 500 genérico, traduzimos para uma mensagem acionável.
      if (error?.code === 'P2003' || error?.code === 'P2014') {
        throw new ConflictException(
          'Este registro não pode ser removido porque está vinculado a um ou mais sinistros.',
        );
      }
      throw error;
    }
  }
}

