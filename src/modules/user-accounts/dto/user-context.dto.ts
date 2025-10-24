export class UserContextDto {
  currentUserId: string;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
