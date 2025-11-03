import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastructure/devices.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteDeviceCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDevicesUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute({ deviceId, userId }: DeleteDeviceCommand): Promise<void> {
    const device = await this.devicesRepository.findDeviceById(deviceId);

    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device id not found',
      });
    }

    if (device.userId.toString() !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'User not owner',
      });
    }

    const result = await this.devicesRepository.deleteDevice(
      deviceId,
      userId,
      device.jti,
    );

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Device id not found',
      });
    }
  }
}
