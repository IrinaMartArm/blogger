import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '../../../user-accounts.config';
import { DevicesRepository } from '../../../security-devices/infrastructure/devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { DecodedRefreshToken } from '../../api/input-dto/login.input-dto';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private config: UserAccountsConfig,
    private deviceRepo: DevicesRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithCookies) => {
          if (req && req.cookies) {
            return req.cookies['refreshToken'];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.refreshTokenSecret,
      // passReqToCallback: true,
    });
  }

  async validate(payload: DecodedRefreshToken): Promise<DecodedRefreshToken> {
    const token = await this.deviceRepo.getSession(
      payload.deviceId,
      payload.currentUserId,
      payload.jti,
    );

    if (!token) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }
    return payload;
  }
}
