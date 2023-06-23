import type { Surreal } from 'surrealdb.js';
import { type OperationType, type QueryElement, Surql2, buildQuery } from '../index.js';
import type * as Schemas from '../schemas.js';

export interface TableAndID<T extends string> {
  table: T;
  ids?: string[];
}

export default <Relations extends Schemas.Relation<string, Schemas.Model<object, string>, Schemas.Model<object, string>>>(db: Surreal) =>
  <Table extends Relations['name'], Relation extends Extract<Relations, { name: Table }>>(params: {
    relation: Table;
    in: TableAndID<Relation['in']['table']>;
    out: TableAndID<Relation['out']['table']>;
    content?: Omit<Relation['relation'], 'in' | 'out' | 'id'> & { id?: string };
  }) => {
    const _surql2 = new Surql2(db);

    const query: QueryElement[] = [];

    const tableOrID = (surql2: Surql2, v: TableAndID<Relation['in']['table']> | TableAndID<Relation['out']['table']>) => {
      const query: QueryElement[] = [];
      query.push(surql2 => /* surrealql */ `select value id from type::table(${surql2.interpolate(v.table)})`);
      if (v.ids)
        query.push(surql2 => /* surrealql */ `where id in ${surql2.interpolate(JSON.stringify(v.ids))}`);
      query.push(() => 'limit 1');
      return buildQuery(surql2, query);
    };

    const contentUnsafe = params.content as Relation['relation'];
    if (contentUnsafe.out || contentUnsafe.in)
      throw new Error('An attempt to set In or Out on a relation, which is forbidden');

    query.push(
      surql2 => /* surrealql */ `relate (${tableOrID(surql2, params.in)})->${params.relation}->(${tableOrID(surql2, params.out)})`
    );
    query.push(() => (params.content ? /* surrealql */ `content ${JSON.stringify(params.content)}` : ''));
    query.push(() => ';');

    const f: OperationType<Relation['relation'][]> = async (surql2: Surql2 = _surql2) => await surql2.query(buildQuery(surql2, query));
    f.query = query;
    return f;
  };
