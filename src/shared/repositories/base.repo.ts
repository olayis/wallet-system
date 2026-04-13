import { Model, QueryBuilder, Transaction } from "objection";
import { ObjectLiteral } from "../../types/object-literal.type";

export class BaseRepository<M extends Model> {
  protected model: typeof Model | any;

  constructor(model: M | any) {
    this.model = model;
  }

  protected query(trx?: Transaction) {
    return this.model.query(trx);
  }

  async findById(id: string, trx?: Transaction): Promise<M> {
    return await this.query(trx).findById(id);
  }

  async findOne(criteria: ObjectLiteral, trx?: Transaction): Promise<M | undefined> {
    return await this.query(trx).findOne(criteria);
  }

  async findAll(trx?: Transaction): Promise<M[]> {
    return await this.query(trx).orderBy("createdAt", "desc");
  }

  async save(data: any, trx?: Transaction): Promise<M> {
    return await this.query(trx).insert(data).returning("*");
  }

  async saveBulk(data: any[], trx?: Transaction): Promise<M> {
    return await this.query(trx).insert(data).returning("*");
  }

  async updateById(id: string, data: any, trx?: Transaction): Promise<M> {
    return await this.query(trx).patchAndFetchById(id, data);
  }

  async deleteById(id: string, trx?: Transaction): Promise<number> {
    return await this.query(trx).deleteById(id);
  }
}
