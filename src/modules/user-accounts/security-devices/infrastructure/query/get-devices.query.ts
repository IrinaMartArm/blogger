import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DevicesQueryRepository } from '../devices.query-repository';
import { DevicesViewDto } from '../../api/view-dto/devices.view-dto';

export class GetDevicesQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetDevicesQuery)
export class GetDevicesQueryHandler implements IQueryHandler<GetDevicesQuery> {
  constructor(private readonly devicesQueryRepo: DevicesQueryRepository) {}
  async execute({ userId }: GetDevicesQuery): Promise<DevicesViewDto[]> {
    return this.devicesQueryRepo.findDevicesByUserId(userId);
  }
}
