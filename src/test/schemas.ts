import type { BasicModel, Model, Relation } from '../sdk/schemas';

export interface UserType extends BasicModel {
  name: 'Физическое лицо' | 'Банк' | 'Страховая' | 'Застройщик' | 'Риелтор';
}
export type CreateUserType = Model<UserType, 'userType'>;

export interface User extends BasicModel {
  name: string;
  surname: string;
  patronymic?: string;
  companyName?: string;
  email: string;
  authToken?: string;
  phone?: string;
  public?: boolean;
  type: UserType | string;
}
export type CreateUser = Model<User, 'user'>;

export type OfType = Relation<'ofType', CreateUser, CreateUserType, { testField: number }>;
export type Test = Relation<'test', CreateUserType, CreateUser>;

export type create = CreateUser | CreateUserType;
export type Tables = create['table'];
export type Relations = OfType | Test;
