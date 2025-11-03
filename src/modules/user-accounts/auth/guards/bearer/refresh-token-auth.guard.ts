import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest<DecodedRefreshToken>(err: any, payload: DecodedRefreshToken) {
    console.log('RefreshTokenGuard payload', payload);
    console.log('RefreshTokenGuard err', err);
    if (err || !payload) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }
    return payload;
  }
}
