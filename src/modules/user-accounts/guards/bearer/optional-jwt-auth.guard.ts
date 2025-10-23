import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<UserContextDto>(
    err: unknown,
    user: UserContextDto | false | null,
  ): UserContextDto | null {
    if (err) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Error while validating token',
      });
    }
    return user || null;
  }
}
