export class CreateUserDto {
  login: string;
  password: string;
  email: string;
}

export class UpdateUserDto {
  email: string;
}
