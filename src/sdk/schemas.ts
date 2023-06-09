export interface Model<T extends object, Table extends string> {
  table: Table;
  model: T;
}
export interface BasicModel {
  id: string;
  createdAt: number;
}
