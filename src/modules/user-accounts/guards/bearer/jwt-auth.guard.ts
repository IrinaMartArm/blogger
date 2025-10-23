import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<UserContextDto>(
    err: unknown,
    user: UserContextDto,
  ): UserContextDto {
    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }
    return user;
  }
}
