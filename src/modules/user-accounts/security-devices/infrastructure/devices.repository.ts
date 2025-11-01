import { Injectable } from '@nestjs/common';
import {
  Device,
  DeviceDocument,
  DeviceModelType,
} from '../domain/device.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel(Device.name) private readonly deviceModel: DeviceModelType,
  ) {}

  async save(device: DeviceDocument): Promise<void> {
    await device.save();
  }

  async deleteDevice(deviceId: string, userId: string): Promise<boolean> {
    const result = await this.deviceModel.deleteOne({ deviceId, userId });
    return result.deletedCount > 0;
  }

  async deleteAllDevices(userId: string): Promise<boolean> {
    const result = await this.deviceModel.deleteMany({ userId });
    return result.deletedCount > 0;
  }

  async getSession(
    deviceId: string,
    userId: string,
  ): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ deviceId, userId });
  }
}
