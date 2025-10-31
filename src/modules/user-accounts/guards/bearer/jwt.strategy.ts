import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../../dto/user-context.dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserAccountsConfig } from '../../user-accounts.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepo: UsersRepository,
    userAccountsConfig: UserAccountsConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: userAccountsConfig.accessTokenSecret,
    });
  }

  async validate(payload: UserContextDto): Promise<UserContextDto> {
    const user = await this.userRepo.findById(payload.currentUserId);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorized',
      });
    }

    return {
      currentUserId: user?._id.toString(),
    };
  }
}
