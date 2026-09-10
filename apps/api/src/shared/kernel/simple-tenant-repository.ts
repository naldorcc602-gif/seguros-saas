import { getCurrentTenantId } from '@seguros/database';

/**
 * Delegate mínimo do Prisma que este repositório genérico precisa (o
 * subconjunto de `prisma.insurer`, `prisma.broker`, etc. que usamos).
 */
export interface SimpleTenantDelegate<T> {
  findMany(args: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<T[]>;
  findFirst(args: { where: Record<string, unknown> }): Promise<T | null>;
  create(args: { data: Record<string, unknown> }): Promise<T>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>;
}

/**
 * CRUD genérico para cadastros auxiliares simples (Seguradora, Corretor,
 * Perito, Oficina, Despachante, Advogado — todos "nome + alguns campos de
 * contato"). Reaproveita a mesma regra já aplicada em ClaimsRepository:
 * `update`/`delete` de registro único NÃO são filtrados automaticamente por
 * tenant pela extensão do Prisma, então usamos `updateMany`/`deleteMany`
 * (que SÃO filtrados) e conferimos `count` antes de considerar sucesso.
 */
export class SimpleTenantRepository<T> {
  constructor(private readonly delegate: SimpleTenantDelegate<T>) {}

  findAll(where?: Record<string, unknown>) {
    return this.delegate.findMany({ where, orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.delegate.findFirst({ where: { id } });
  }

  create(data: Record<string, unknown>) {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('SimpleTenantRepository.create chamado fora de um contexto de requisição autenticado.');
    }
    return this.delegate.create({ data: { ...data, tenantId } });
  }

  async update(id: string, data: Record<string, unknown>): Promise<T | null> {
    const result = await this.delegate.updateMany({ where: { id }, data });
    if (result.count === 0) return null;
    return this.delegate.findFirst({ where: { id } });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.delegate.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
