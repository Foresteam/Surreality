import type { Surreal } from 'surrealdb.js';
import { Surql2 } from '../index.js';
import type { OperationType } from '../index.js';
import { type WhereInput, withWhere } from './composables/withWhere.js';

export default <Tables extends string>(db: Surreal) =>
  <Table extends Tables>(params: { targets: { table: Table; id?: string }[]; where?: WhereInput }): OperationType<void> => {
    const _surql2 = new Surql2(db);
    const query: ((surql2: Surql2) => string)[] = [];

    query.push(
      surql2 => /* surrealql */ `
          delete ${params.targets.map(v => (v.id ? surql2.interpolate(v.id) : `type::table(${surql2.interpolate(v.table)})`))}
        `
    );
    withWhere(query, params);
    query.push(() => ';');

    const f: OperationType<void> = async (surql2: Surql2 = _surql2) => await surql2.query(query.map(q => q(surql2)).join('\n'));
    f.query = query;
    return f;
  };
