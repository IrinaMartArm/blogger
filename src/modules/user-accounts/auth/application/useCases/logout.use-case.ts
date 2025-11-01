import { ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security-devices/infrastructure/devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Inject } from '@nestjs/common';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../../constants/token.constants';
import { JwtService } from '@nestjs/jwt';
import { DecodedRefreshToken } from '../../api/input-dto/login.input-dto';

export class LogoutCommand {
  constructor(public readonly refreshToken: string) {}
}
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly deviceRepo: DevicesRepository,
  ) {}

  async execute({ refreshToken }: LogoutCommand): Promise<void> {
    try {
      const decodedToken: DecodedRefreshToken =
        this.refreshTokenContext.verify(refreshToken);
      const { currentUserId, deviceId } = decodedToken;

      const session = await this.deviceRepo.getSession(deviceId, currentUserId);

      if (!session) {
        throw new DomainException({
          code: DomainExceptionCode.Unauthorized,
          message: 'Session not found',
        });
      }

      await this.deviceRepo.deleteDevice(deviceId, currentUserId);
    } catch (e: any) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }
  }
}
