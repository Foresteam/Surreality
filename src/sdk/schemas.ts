import type { AnyZodObject, Primitive, ZodLiteral, infer as zInfer } from 'zod';

export type ID<T extends object> = T & string;
export interface Model<T extends object, Table extends string> {
  table: Table;
  model: T;
}
export interface BasicModel {
  id: string;
  createdAt: number;
}

export interface BasicRelation<In extends object, Out extends object> {
  id: string;
  in: ID<In>;
  out: ID<Out>;
}
export interface Relation<Name extends string, In extends Model<object, string>, Out extends Model<object, string>, Content = {}> {
  name: Name;
  in: In;
  out: Out;
  relation: BasicRelation<In['model'], Out['model']> & Content;
}

export type ZodLiteralTuple<T extends readonly Primitive[]> = {
  readonly [K in keyof T]: ZodLiteral<T[K]>;
};
export type SchemaType<T extends AnyZodObject, Additional extends object = {}> = zInfer<T> & BasicModel & Additional;
