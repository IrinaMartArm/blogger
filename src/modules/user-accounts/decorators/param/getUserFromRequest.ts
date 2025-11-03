import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
import { Request } from 'express';
import { DecodedRefreshToken } from '../../auth/api/input-dto/login.input-dto';

export const GetUserFromRequest = createParamDecorator(
  (data: 'access' | 'refresh' | undefined, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();

    const user = request.user;
    if (!user) {
      return null;
    }
    if (data === 'refresh') {
      return user as DecodedRefreshToken;
    }
    return user as UserContextDto;
  },
);
