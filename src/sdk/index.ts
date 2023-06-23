import type Surreal from 'surrealdb.js';
import type { PartialDeep } from 'type-fest';
import select from './statements/select.js';
import delete_ from './statements/delete.js';
import type { BasicModel, Model, Relation } from './schemas.js';
import { transaction } from './statements/transaction.js';
import relate from './statements/relate.js';

export interface OperationType<T> {
  (surql2?: Surql2): Promise<T>;
  query: Array<(surql2: Surql2) => string>;
}

export type Surql2Arg = string | number | undefined | null | symbol;
export class Surql2 {
  #args: Record<string, Surql2Arg>;
  db: Surreal;

  constructor(db: Surreal) {
    this.db = db;
    this.#args = {};
  }

  query<T>(query: string) {
    query = query.replaceAll('\n', ' ').replace(/\s+/g, ' ');
    console.log(query, this.#args);
    return this.db.query(query, this.#args).then(rs => rs.at(0)?.result) as Promise<object> as Promise<T>;
  }

  interpolate(arg: Surql2Arg) {
    const key = `a${Object.keys(this.#args).length}`;
    this.#args[key] = arg;
    return `$${key}`;
  }
}

export type QueryElement = (surql2: Surql2) => string;
export const buildQuery = (surql2: Surql2, query: QueryElement[]): string => query.map(q => q(surql2)).join('\n');

export const SDK = <
  Create extends Model<object, string>,
  Tables extends string,
  Relations extends Relation<string, Model<object, string>, Model<object, string>>
>(
    db: Surreal
  ) => ({
    select: select<Tables, Create, Relations>(db),
    delete: delete_<Tables>(db),
    surql: <T>(template: TemplateStringsArray, ...args: (string | number | undefined | null)[]): Promise<T[]> => {
      let t = template[0];
      for (let i = 0; i < args.length; i++)
        t += `$a${i}${template[i + 1]}`;
      console.log(t, template, Object.fromEntries(args.map((a, i) => [`a${i}`, a])));
      return db.query(t, Object.fromEntries(args.map((a, i) => [`a${i}`, a]))).then(rs => rs.at(0)?.result) as Promise<object> as Promise<
      T[]
    >;
    },
    create: <Table extends Tables, C = Extract<Create, { table: Table }>['model']>(args: {
    table: Table;
    query: Omit<C, keyof BasicModel> & Partial<BasicModel>;
  }): OperationType<C[]> => {
      const _surql2 = new Surql2(db);
      const query = [
        (surql2: Surql2) =>
        /* surrealql */ `create type::table(${surql2.interpolate(args.table)}) content ${JSON.stringify({
            createdAt: Date.now(),
            ...args.query
          })};`
      ];
      const f: OperationType<C[]> = (surql2: Surql2 = _surql2) => surql2.query(query.map(q => q(surql2)).join('\n')) as Promise<C[]>;
      f.query = query;
      return f;
    },
    merge: <T extends Model<object, string>>(args: Omit<T, 'model'> & { query: PartialDeep<T['model']> }): Promise<T['model'][]> =>
    db.merge(args.table, args.query as object as Record<string, unknown>) as Promise<object> as Promise<T['model'][]>,
    transaction: transaction(db),
    relate: relate<Relations>(db)
  });

export * from './schemas.js';
