import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'Express';

// @Injectable()
// export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
//   handleRequest<UserContextDto>(
//     err: unknown,
//     user: UserContextDto | false | null,
//   ): UserContextDto | null {
//     if (err) {
//       throw new DomainException({
//         code: DomainExceptionCode.InternalServerError,
//         message: 'Error while validating token',
//       });
//     }
//     return user || null;
//   }
// }
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<UserContextDto>(
    err: any,
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

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return true;
    }

    return super.canActivate(context);
  }
}
