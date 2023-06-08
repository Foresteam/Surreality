import type { Model } from '../sdk/schemas';

export interface Human {
  id: string;
  name: string;
  surname: string;
  penis: {
    length: number;
    diameter: number;
    functional: boolean;
  } | null;
  mother: Human | null;
}
export interface Orphan extends Human {
  mother: null;
}
export interface CreateHuman extends Model<Human> {
  table: 'human';
}
export type create = CreateHuman;
