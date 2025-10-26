import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/token.constants';

export class LoginCommand {
  constructor(public readonly dto: { currentUserId: string }) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}
  execute({ dto }: LoginCommand): Promise<{ accessToken: string }> {
    const accessToken = this.accessTokenContext.sign({
      id: dto.currentUserId,
    });

    const refreshToken = this.refreshTokenContext.sign({
      id: dto.currentUserId,
      deviceId: 'deviceId',
    });

    console.log('refreshToken', refreshToken);

    return Promise.resolve({ accessToken });
  }
}
