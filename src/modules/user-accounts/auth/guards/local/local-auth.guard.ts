import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // handleRequest<UserContextDto>(err, user: UserContextDto) {
  //   if (err || !user) {
  //     console.log('err', err);
  //   }
  //   return user;
  // }
}
