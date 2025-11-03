import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/token.constants';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import {
  Device,
  DeviceModelType,
} from '../../../security-devices/domain/device.entity';
import { DevicesRepository } from '../../../security-devices/infrastructure/devices.repository';
import { DecodedRefreshToken } from '../../api/input-dto/login.input-dto';

export class LoginCommand {
  constructor(
    public readonly currentUserId: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginUseCase implements ICommandHandler<LoginCommand> {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: DeviceModelType,
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private readonly devicesRepository: DevicesRepository,
  ) {}
  async execute({
    currentUserId,
    ip,
    userAgent,
  }: LoginCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const deviceId = randomUUID();
    const jti = randomUUID();

    const accessToken = this.accessTokenContext.sign({
      currentUserId,
    });

    const refreshToken = this.refreshTokenContext.sign({
      currentUserId,
      deviceId,
      jti,
      ip,
    });

    const decodedRefreshToken: DecodedRefreshToken =
      this.refreshTokenContext.decode(refreshToken);
    const expiresAt = new Date(decodedRefreshToken.exp * 1000);

    const device = this.deviceModel.createInstance({
      userId: currentUserId,
      deviceId,
      jti,
      ip,
      userAgent,
      lastActive: new Date(),
      expiresAt,
    });

    await this.devicesRepository.save(device);

    return { accessToken, refreshToken };
  }
}
