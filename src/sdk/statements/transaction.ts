import type { Surreal } from 'surrealdb.js';
import { type OperationType, Surql2 } from '../index.js';

export const transaction
  = (db: Surreal) =>
    async <QF extends OperationType<object>>(...queries: QF[]) => {
      const surql2 = new Surql2(db);
      const qs = [
        'begin transaction;',
        ...queries
          .map(q => q.query)
          .flat()
          .map(q => q(surql2)),
        'commit transaction;'
      ];

      return (await surql2.query(qs.join('\n '))) as ReturnType<QF>;
    };
