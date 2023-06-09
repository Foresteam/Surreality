import type { Surreal } from 'surrealdb.js';
import type { PartialDeep } from 'type-fest';
import { Surql2 } from '../index.js';
import type { Model } from '../schemas.js';

type ToBooleanish<T extends object> = { [key in keyof T]: T[key] extends object ? ToBooleanish<T[key]> | boolean : boolean };
interface Booleanish {
  [key: string]: Booleanish | boolean;
}

const fieldsToDot = (booleanish: Booleanish, path?: string[]) => {
  let dotFields: string[] = [];
  for (const [k, v] of Object.entries(booleanish)) {
    if (typeof v === 'boolean')
      dotFields.push([...(path || []), k].join('.'));
    else
      dotFields = dotFields.concat(fieldsToDot(booleanish, [...(path || []), k]) as string[]);
  }
  return dotFields;
};

export type FetchedEntry<M extends object, Key extends keyof M> = {
  [key in keyof M]: key extends Key ? Exclude<M[key], string> : M[key];
};

export const select
  = <Tables extends string, Create extends Model<object, string>>(db: Surreal) =>
    async <
    Table extends Tables,
    M extends Extract<Create, { table: Table }>['model'],
    FetchKeys extends keyof M,
    MFetched extends FetchedEntry<M, FetchKeys>
  >(params: {
    from: ({ table: Table; id?: undefined } | { table?: undefined; id: string })[];
    fields?: true | PartialDeep<ToBooleanish<MFetched>>;
    fetch?: FetchKeys[];
    pagination?: {
      start?: number;
      count?: number;
    };
    order?: {
      sort: 'ASC' | 'DESC';
      by: keyof M;
    }[];
  }) => {
      const surql2 = new Surql2(db);
      const query: ((surql2: Surql2) => string)[] = [];

      const fields = params.fields === true || params.fields === undefined ? '*' : fieldsToDot(params.fields as Booleanish).join(', ');
      query.push(
        surql2 => /* surrealql */ `
          select ${fields} from
          ${params.from.map(v => (v.id ? surql2.interpolate(v.id) : `type::table(${surql2.interpolate(v.table)})`))}
        `
      );
      query.push(() => (params.order ? /* surrealql */ `order by ${params.order.map(v => `${String(v.by)} ${v.sort}`).join(', ')}` : ''));
      query.push(() => (params.pagination?.count ? /* surrealql */ `limit ${params.pagination?.count}` : ''));
      query.push(() => (params.pagination?.start ? /* surrealql */ `start at ${params.pagination?.start}` : ''));
      query.push(() => {
        if (!params.fetch)
          return '';
        return /* surrealql */ `fetch ${params.fetch?.join(', ')}`;
      });
      query.push(() => ';');

      return (await surql2.query(query.map(q => q(surql2)).join('\n'))) as MFetched[];
    };
