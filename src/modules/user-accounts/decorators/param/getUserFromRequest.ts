import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
import { Request } from 'express';

export const GetUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto | null => {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as UserContextDto;
    if (!user) {
      return null;
    }
    return { currentUserId: user.currentUserId };
  },
);
