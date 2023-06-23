import Surreal from 'surrealdb.js';
import { SDK } from '../sdk/index.js';
import type * as Schemas from './schemas.js';

const db = new Surreal('http://127.0.0.1:3500/rpc');

(async () => {
  await db.signin({
    user: 'root',
    pass: 'root'
  });
  await db.use({ db: 'test', ns: 'test' });

  const surreality = SDK<Schemas.create, Schemas.Tables, Schemas.Relations>(db);

  const phys = (
    await surreality.create({
      table: 'userType',
      query: {
        name: 'Физическое лицо'
      }
    })()
  )[0];
  const men = await surreality.transaction(
    surreality.create({
      table: 'user',
      query: {
        name: 'Vadid',
        surname: 'Tyhe',
        email: 'vadid@gmail.com',
        type: phys.id
      }
    }),
    surreality.create({
      table: 'user',
      query: {
        name: 'Vaserman',
        surname: 'HEHEH',
        email: 'vaserman@gmail.com',
        type: phys.id
      }
    })
  );
  console.log(men);

  const withFetched = await surreality.select({
    from: [{ table: 'user' }],
    fields: {
      name: true,
      email: true,
      type: {
        name: true
      },
      createdAt: true
    },
    order: [
      {
        sort: 'DESC',
        by: 'createdAt'
      }
    ],
    pagination: {
      count: 5
    },
    fetch: ['type'],
    where: [
      [
        {
          value: <keyof Schemas.User>'name',
          interpolate: false
        },
        '=',
        'Vaserman'
      ]
    ]
  })();
  console.log(withFetched);
  console.log(
    await surreality.delete({
      targets: [{ table: 'user' }],
      where: [[{ value: <keyof Schemas.User>'name', interpolate: false }, '=', 'Vaserman']]
    })()
  );

  console.log(
    await surreality.relate({
      relation: 'ofType',
      in: { table: 'user', ids: [men[0].id] },
      out: { table: 'userType', ids: [phys.id] },
      content: {
        testField: 47
      }
    })()
  );

  db.close();
})();
