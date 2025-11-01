import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../../../dto/user-context.dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserAccountsConfig } from '../../../user-accounts.config';
import { UsersRepository } from '../../../user/infrastructure/users.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepo: UsersRepository,
    private config: UserAccountsConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessTokenSecret,
    });
  }

  async validate(payload: UserContextDto): Promise<UserContextDto> {
    const user = await this.userRepo.findById(payload.currentUserId);

    console.log('ACCESS_TOKEN_SECRET:', this.config.accessTokenSecret);

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
