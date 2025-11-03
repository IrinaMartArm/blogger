import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security-devices/infrastructure/devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { Inject } from '@nestjs/common';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../../constants/token.constants';
import { JwtService } from '@nestjs/jwt';
import { DecodedRefreshToken } from '../../api/input-dto/login.input-dto';

export class LogoutCommand {
  constructor(public readonly payload: DecodedRefreshToken) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly deviceRepo: DevicesRepository,
  ) {}

  async execute({ payload }: LogoutCommand): Promise<void> {
    const { currentUserId, deviceId, jti } = payload;

    const session = await this.deviceRepo.getSession(
      deviceId,
      currentUserId,
      jti,
    );

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Session not found',
      });
    }

    const result = await this.deviceRepo.deleteDevice(
      deviceId,
      currentUserId,
      jti,
    );

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Session not found',
      });
    }
    return;
  }
}
