import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../../dto/user-context.dto';
import { SETTINGS } from '../../../../settings';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SETTINGS.JWT_ACCESS_SECRET || '',
    });
  }

  validate(payload: UserContextDto): UserContextDto {
    return payload;
  }
}
