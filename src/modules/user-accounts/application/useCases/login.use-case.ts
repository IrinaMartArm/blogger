import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/token.constants';

export class LoginCommand {
  constructor(
    public readonly currentUserId: string,
    public readonly ip: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}
  execute({
    currentUserId,
    ip,
    deviceId,
  }: LoginCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.accessTokenContext.sign({
      currentUserId,
    });

    const refreshToken = this.refreshTokenContext.sign({
      currentUserId,
      ip,
      deviceId,
    });

    return Promise.resolve({ accessToken, refreshToken });
  }
}
