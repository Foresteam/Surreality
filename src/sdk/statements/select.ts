import type { Surreal } from 'surrealdb.js';
import { Surql2 } from '../index.js';
import type { Model } from '../schemas.js';

export const from
  = (db: Surreal) =>
  <T extends Model<object>>(...from: ({ table: T['table']; id?: undefined } | { table?: undefined; id: string })[]) => {
    const vars = {
      from,
      toFetch: [] as (keyof T['model'])[],
      fields: [] as (keyof T['model'])[],
      theLimit: undefined as undefined | number,
      startFrom: undefined as undefined | number,
      theOrder: undefined as undefined | { order: 'ASC' | 'DESC'; by: (keyof T['model'])[] }
    };

    return Object.freeze({
      select(...fields: typeof vars.fields) {
        vars.fields = fields;
        return this;
      },
      fetch(...toFetch: typeof vars.toFetch) {
        vars.toFetch = toFetch;
        return this;
      },
      limit(limit: number) {
        vars.theLimit = limit;
        return this;
      },
      start(from: number) {
        vars.startFrom = from;
        return this;
      },
      order(order: Exclude<typeof vars.theOrder, undefined>['order'], ...by: (keyof T['model'])[]) {
        vars.theOrder = { order, by };
        return this;
      },
      async end() {
        const surql2 = new Surql2(db);
        return (await surql2.query(
          `select ${vars.fields.length > 0 ? vars.fields.join(', ') : '*'} from
            ${vars.from.map(v => (v.id ? surql2.interpolate(v.id) : `type::table(${surql2.interpolate(v.table)})`))}
          ${vars.theOrder ? `order by ${vars.theOrder.by.join(', ')} ${vars.theOrder.order}` : ''}
          ${vars.theLimit ? `limit ${vars.theLimit}` : ''}
          ${vars.startFrom ? `start at ${surql2.interpolate(vars.startFrom)}` : ''}
          ${vars.toFetch.length > 0 ? `fetch ${vars.toFetch.join(', ')}` : ''}
          ;`
        )) as T['model'][];
      }
    });
  };
