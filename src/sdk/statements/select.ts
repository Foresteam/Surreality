import type { Surreal } from 'surrealdb.js';
import type { Surql2 } from '../index.js';
import type { Model } from '../schemas.js';
import { begin } from '../composables.js';

export const from
  = (db: Surreal) =>
  <T extends Model<object>>(...from: ({ table: T['table']; id?: undefined } | { table?: undefined; id: string })[]) => {
    const r = begin<T>(db);
    const vars = { from, fields: [] as (keyof T['model'])[] };
    const query = [
      (surql2: Surql2) => `select ${vars.fields.length > 0 ? vars.fields.join(', ') : '*'} from
                  ${vars.from.map(v => (v.id ? surql2.interpolate(v.id) : `type::table(${surql2.interpolate(v.table)})`))}`
    ];
    const { 1: methods } = r.withFetch(
      ...r.withStart(
        ...r.withLimit(
          ...r.withOrder(
            vars,
            {
              select(...fields: typeof vars.fields) {
                vars.fields = fields;
                return methods;
              },
              ...r.useEnd(vars, {}, query)
            },
            query
          )
        )
      )
    );

    return Object.freeze(methods);
  };
