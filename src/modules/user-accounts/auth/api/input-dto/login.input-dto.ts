import { IsString } from 'class-validator';

export class LoginInputDto {
  @IsString()
  loginOrEmail: string;

  @IsString()
  password: string;
}

export class ConfirmCodeDto {
  @IsString()
  code: string;
}

export interface DecodedRefreshToken {
  currentUserId: string;
  deviceId: string;
  ip: string;
  iat: number;
  exp: number; // ← Автоматически! Время истечения (expiration)
}
