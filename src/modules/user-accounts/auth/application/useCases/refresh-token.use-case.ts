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

export class RefreshTokenCommand {
  constructor(public readonly oldRefreshToken: string) {}
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
  async execute({ oldRefreshToken }: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    console.log('oldRefreshToken:', oldRefreshToken);

    try {
      const decoded: DecodedRefreshToken =
        this.refreshTokenContext.verify(oldRefreshToken);

      if (!decoded?.deviceId || !decoded?.currentUserId) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Invalid refresh token payload',
        });
      }

      const { currentUserId, deviceId, ip } = decoded;

      const session = await this.devicesRepository.getSession(
        deviceId,
        currentUserId,
      );

      console.log('session:', session);

      if (!session) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Unauthorized',
        });
      }

      const accessToken = this.accessTokenService.sign({ currentUserId });

      const refreshToken = this.refreshTokenContext.sign({
        currentUserId,
        deviceId,
        ip,
      });

      const decodedRefreshToken: DecodedRefreshToken =
        this.refreshTokenContext.decode(refreshToken);

      const expiresAt = new Date(decodedRefreshToken.exp * 1000);

      session.updateSession(expiresAt);
      await this.devicesRepository.save(session);

      return { accessToken, refreshToken };
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid or expired refresh token',
      });
    }
  }
}
