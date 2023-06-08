import Surreal from 'surrealdb.js';
import { DB } from '../sdk/index.js';
import type * as Schemas from './schemas.js';

const db = new Surreal('http://127.0.0.1:8000/rpc');

function TSW(db: Surreal) {
  return {
    create: <T extends Schemas.create, C extends T['model']>(args: {
      table: T['table'];
      query: Omit<C, 'id'> & { id?: string };
    }): Promise<T['model'][]> =>
      db.create(args.table, args.query as object as Record<string, unknown>) as Promise<object> as Promise<T['model'][]>,
    merge: <T extends Schemas.create>(args: Omit<T, 'model'> & { query: Partial<T['model']> }): Promise<T['model'][]> =>
      db.merge(args.table, args.query as object as Record<string, unknown>) as Promise<object> as Promise<T['model'][]>,
    select: <T extends Schemas.create>(args: Partial<T> & { table: string; key?: string }): Promise<T['model'][]> =>
      db.select(args.table) as Promise<object> as Promise<T['model'][]>
  };
}

(async () => {
  await db.signin({
    user: 'root',
    pass: 'root'
  });
  await db.use({ db: 'test', ns: 'test' });

  const tsw = TSW(db);
  const mom = (
    await tsw.create<Schemas.CreateHuman, Schemas.Orphan>({
      table: 'human',
      query: {
        name: 'The',
        surname: 'Mon',
        penis: null,
        mother: null
      }
    })
  ).at(0);
  const vadid = (
    await tsw.create({
      table: 'human',
      query: {
        name: 'The',
        surname: 'Vadid',
        penis: null,
        mother: mom?.id as unknown as null
      }
    })
  ).at(0);

  const surreality = DB(db);
  console.log(
    await surreality.from<Schemas.CreateHuman>({ table: 'human' }).select().fetch('mother').order('DESC', 'id').limit(5).start(0).end()
  );
  // const surql = surqlNew(db);
  // console.log((await surql`select * from ${vadid?.id} fetch mother;`).at(0));
  // console.log(tsw.select({ table: undefined }));
  // const me = await db.create('person', {
  //   name: {
  //     first: 'Sir',
  //     last: 'McNuggets'
  //   },
  //   job: 'Bug generation'
  // });
  // const another = await db.create('person', {
  //   name: {
  //     first: 'Vaser',
  //     last: 'Man'
  //   },
  //   job: 'Bug generation'
  // });
  // await db.create('person', {
  //   name: {
  //     first: 'Sex',
  //     last: 'Server'
  //   },
  //   job: 'Bug themselves'
  // });
  // const ws = await db.create('workspace', {
  //   name: 'A workspace',
  //   people: []
  // });
  // (ws[0].people as typeof me).push(me[0]);
  // (ws[0].people as typeof me).push(another[0]);
  // console.log(ws);
  // await db.update(ws[0].id, ws[0]);

  // console.log((await db.select('workspace')).map(r => r?.people));
  // await surql(db)`update person:q3amsg9d9wb7asdh8l23 set name.first = type::string(${'first'});`;
  // console.log((await db.select('person:q3amsg9d9wb7asdh8l23')).at(0)?.name);
  db.close();
})();
