import type Surreal from 'surrealdb.js';
import type { PartialDeep } from 'type-fest';
import { select } from './statements/select.js';
import type { BasicModel, Model } from './schemas.js';

type Surql2Arg = string | number | undefined | null | symbol;
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

export const DB = <Create extends Model<object, string>, Tables extends string>(db: Surreal) => ({
  select: select<Tables, Create>(db),
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
  }) =>
    db.create(args.table, { createdAt: Date.now(), ...args.query } as object as Record<string, unknown>) as Promise<object> as Promise<C[]>,
  merge: <T extends Model<object, string>>(args: Omit<T, 'model'> & { query: PartialDeep<T['model']> }): Promise<T['model'][]> =>
    db.merge(args.table, args.query as object as Record<string, unknown>) as Promise<object> as Promise<T['model'][]>
});
