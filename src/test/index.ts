import Surreal from 'surrealdb.js';
import { DB } from '../sdk/index.js';
import type * as Schemas from './schemas.js';

const db = new Surreal('http://127.0.0.1:8000/rpc');

(async () => {
  await db.signin({
    user: 'root',
    pass: 'root'
  });
  await db.use({ db: 'test', ns: 'test' });

  const surreality = DB<Schemas.create, Schemas.Tables>(db);

  const phys = (
    await surreality.create({
      table: 'userType',
      query: {
        name: 'Физическое лицо'
      }
    })
  )[0];
  const vadid = (
    await surreality.create({
      table: 'user',
      query: {
        name: 'Vadid',
        surname: 'Tyhe',
        email: 'vadid@gmail.com',
        type: phys.id
      }
    })
  )[0];

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
    fetch: ['type']
  });
  console.log(withFetched);

  // const rs = await surreality.select<Schemas.CreateHuman>({ table: 'human' }).select().fetch('mother').end();
  // console.log(rs);
  db.close();
})();
