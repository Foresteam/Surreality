import type { Surreal } from 'surrealdb.js';
import type { Model } from './schemas.js';
import { Surql2 } from './index.js';

export const begin
  = <T extends Model<object>>(db: Surreal) =>
  <Vars extends object, Methods extends object>(vars: Vars, methods: Methods, query: Array<(surql2: Surql2) => string>) => ({
      withFetch() {
        const toFetch = [] as (keyof T['model'])[];
        const _vars = vars as Vars & { toFetch: typeof toFetch };
        _vars.toFetch = toFetch;
        const fetch = function (this: Methods, ...toFetch: typeof _vars.toFetch) {
          _vars.toFetch = toFetch;
          return this;
        };

        const _methods = methods as Methods & { fetch: typeof fetch };
        _methods.fetch = fetch;

        query.push(() => (_vars.toFetch.length > 0 ? `fetch ${_vars.toFetch.join(', ')}` : ''));

        return {
          methods: _methods,
          vars: _vars,
          query,
          ...begin<T>(db)(_vars, _methods, query)
        };
      },
      withLimit() {
        const theLimit = undefined as undefined | number;
        const _vars = vars as Vars & { theLimit: typeof theLimit };
        _vars.theLimit = theLimit;
        const limit = function (this: Methods, limit: number) {
          _vars.theLimit = limit;
          return this;
        };

        const _methods = methods as Methods & { limit: typeof limit };
        _methods.limit = limit;

        query.push(() => (_vars.theLimit ? `limit ${_vars.theLimit}` : ''));

        return {
          methods: _methods,
          vars: _vars,
          query,
          ...begin<T>(db)(_vars, _methods, query)
        };
      },
      withStart() {
        const startFrom = undefined as undefined | number;
        const _vars = vars as Vars & { startFrom: typeof startFrom };
        _vars.startFrom = startFrom;
        const start = function (this: Methods, from: number) {
          _vars.startFrom = from;
          return this;
        };

        const _methods = methods as Methods & { start: typeof start };
        _methods.start = start;

        query.push(surql2 => (_vars.startFrom ? `start at ${surql2.interpolate(_vars.startFrom)}` : ''));

        return {
          methods: _methods,
          vars: _vars,
          query,
          ...begin<T>(db)(_vars, _methods, query)
        };
      },
      withOrder() {
        const theOrder = undefined as undefined | { order: 'ASC' | 'DESC'; by: (keyof T['model'])[] };
        const _vars = vars as Vars & { theOrder: typeof theOrder };
        _vars.theOrder = theOrder;
        const order = function (this: Methods, order: Exclude<typeof _vars.theOrder, undefined>['order'], ...by: (keyof T['model'])[]) {
          _vars.theOrder = { order, by };
          return this;
        };

        const _methods = methods as Methods & { order: typeof order };
        _methods.order = order;

        query.push(() => (_vars.theOrder ? `order by ${_vars.theOrder.by.join(', ')} ${_vars.theOrder.order}` : ''));

        return {
          methods: _methods,
          vars: _vars,
          query,
          ...begin<T>(db)(_vars, _methods, query)
        };
      },

      withEnd() {
        const end = async () => {
          const surql2 = new Surql2(db);
          query.push(() => ';');
          return (await surql2.query(query.map(q => q(surql2)).join('\n'))) as T['model'][];
        };
        const _methods = methods as Methods & { end: typeof end };
        _methods.end = end;
        return {
          methods: _methods,
          vars,
          query,
          ...begin<T>(db)(vars, _methods, query)
        };
      }
    });
