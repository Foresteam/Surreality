import type { AnyZodObject, Primitive, ZodLiteral, infer as zInfer } from 'zod';

export interface Model<T extends object, Table extends string> {
  table: Table;
  model: T;
}
export interface BasicModel {
  id: string;
  createdAt: number;
}

export type ZodLiteralTuple<T extends readonly Primitive[]> = {
  readonly [K in keyof T]: ZodLiteral<T[K]>;
};
export type SchemaType<T extends AnyZodObject, Additional extends object = {}> = zInfer<T> & BasicModel & Additional;
