import type { Surql2, Surql2Arg } from '../../index.js';

export type WhereSelectArg = Surql2Arg | { value: Surql2Arg; interpolate: boolean };
export type WhereInput =
  | {
      0: WhereSelectArg;
      1: '=' | '>' | '<' | '<=' | '>=' | '!=';
      2?: WhereSelectArg | undefined;
    }[]
  | undefined;
export const processInterpolation = (surql2: Surql2, arg?: WhereSelectArg) => {
  const objArg = arg as Exclude<WhereSelectArg, Surql2Arg> | undefined;
  const value = (objArg?.interpolate !== undefined ? objArg?.value : arg) as Surql2Arg | undefined;
  if (objArg?.interpolate === false)
    return value;
  if (typeof value === 'number') {
    if (value.toString().includes('.'))
      return `type::float(${surql2.interpolate(value)})`;
    else
      return `type::int(${surql2.interpolate(value)})`;
  }
  return surql2.interpolate(value);
};
export const withWhere = (query: ((surql2: Surql2) => string)[], params: { where?: WhereInput }) =>
  query.push(surql2 =>
    params.where
      ? /* surrealql */ `where ${params.where
        .map(v => [processInterpolation(surql2, v[0]), v[1], processInterpolation(surql2, v[2])].filter(v => !!v).join(' '))
        .join(', ')}`
      : ''
  );
