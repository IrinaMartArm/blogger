export class UserContextDto {
  userId: string;
  email?: string;
  login?: string;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
