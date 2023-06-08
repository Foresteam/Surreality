import type Surreal from 'surrealdb.js';
import { from } from './statements/select.js';

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

type FilterUndefined<T extends any[]> = T extends []
  ? []
  : T extends [infer H, ...infer R]
  ? H extends undefined
    ? FilterUndefined<R>
    : [H, ...FilterUndefined<R>]
  : T;
type UndefIndex<T extends any[], I extends number> = {
  [P in keyof T]: P extends Exclude<keyof T, keyof any[]> ? (P extends `${I}` ? undefined : T[P]) : T[P];
};
type SpliceTuple<T extends any[], I extends number> = FilterUndefined<UndefIndex<T, I>>;

export const DB = (db: Surreal) => ({
  from: from(db),
  surql: <T>(template: TemplateStringsArray, ...args: (string | number | undefined | null)[]): Promise<T[]> => {
    let t = template[0];
    for (let i = 0; i < args.length; i++)
      t += `$a${i}${template[i + 1]}`;
    console.log(t, template, Object.fromEntries(args.map((a, i) => [`a${i}`, a])));
    return db.query(t, Object.fromEntries(args.map((a, i) => [`a${i}`, a]))).then(rs => rs.at(0)?.result) as Promise<object> as Promise<
      T[]
    >;
  }
});
