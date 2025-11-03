import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/token.constants';
import { JwtService } from '@nestjs/jwt';
import { DecodedRefreshToken } from '../../api/input-dto/login.input-dto';
import { DevicesRepository } from '../../../security-devices/infrastructure/devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { randomUUID } from 'node:crypto';

export class RefreshTokenCommand {
  constructor(public readonly payload: DecodedRefreshToken) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenService: JwtService,
    private readonly devicesRepository: DevicesRepository,
  ) {}
  async execute({ payload }: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { currentUserId, deviceId, ip, jti } = payload;

    const session = await this.devicesRepository.getSession(
      deviceId,
      currentUserId,
      jti,
    );

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    const newJti = randomUUID();

    const accessToken = this.accessTokenService.sign({ currentUserId });

    const refreshToken = this.refreshTokenContext.sign({
      currentUserId,
      deviceId,
      jti: newJti,
      ip,
    });

    const decodedRefreshToken: DecodedRefreshToken =
      this.refreshTokenContext.decode(refreshToken);

    const expiresAt = new Date(decodedRefreshToken.exp * 1000);

    session.updateSession(expiresAt, newJti);
    await this.devicesRepository.save(session);

    return { accessToken, refreshToken };
  }
}
