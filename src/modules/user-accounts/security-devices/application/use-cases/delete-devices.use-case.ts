import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastructure/devices.repository';

export class DeleteDevicesCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(DeleteDevicesCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDevicesCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute({ userId, deviceId }: DeleteDevicesCommand): Promise<void> {
    await this.devicesRepository.deleteAllDevices(userId, deviceId);
  }
}
