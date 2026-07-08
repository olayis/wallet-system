import { Model, ModelClass, Transaction } from "objection";

export class BaseRepository<M extends Model> {
  protected readonly model: ModelClass<M>;

  constructor(model: ModelClass<M>) {
    this.model = model;
  }

  protected query(trx?: Transaction) {
    return this.model.query(trx);
  }

  async findById(id: string, trx?: Transaction): Promise<M | undefined> {
    return (await this.query(trx).findById(id)) as M | undefined;
  }

  async findOne(criteria: Partial<M>, trx?: Transaction): Promise<M | undefined> {
    return (await this.query(trx).findOne(criteria as Record<string, unknown>)) as M | undefined;
  }

  async findAll(trx?: Transaction): Promise<M[]> {
    return this.query(trx).orderBy("createdAt", "desc") as unknown as Promise<M[]>;
  }

  async save(data: Partial<M>, trx?: Transaction): Promise<M> {
    return (await this.query(trx).insert(data as Record<string, unknown>).returning("*")) as unknown as M;
  }

  async saveBulk(data: Array<Partial<M>>, trx?: Transaction): Promise<M[]> {
    return (await this.query(trx).insert(data as Record<string, unknown>[]).returning("*")) as unknown as M[];
  }

  async updateById(id: string, data: Partial<M>, trx?: Transaction): Promise<M> {
    return (await this.query(trx).patchAndFetchById(id, data as Record<string, unknown>)) as unknown as M;
  }

  async deleteById(id: string, trx?: Transaction): Promise<number> {
    return await this.query(trx).deleteById(id);
  }
}
