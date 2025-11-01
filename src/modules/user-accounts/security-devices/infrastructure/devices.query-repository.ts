import { Injectable } from '@nestjs/common';
import { Device, DeviceModelType } from '../domain/device.entity';
import { InjectModel } from '@nestjs/mongoose';
import { DevicesViewDto } from '../api/view-dto/devices.view-dto';

@Injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: DeviceModelType,
  ) {}

  async findDevicesByUserId(userId: string): Promise<DevicesViewDto[]> {
    const items = await this.deviceModel.find({ userId });
    return items.map((item) => DevicesViewDto.mapToView(item));
  }
}
