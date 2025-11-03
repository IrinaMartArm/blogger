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

  async findDeviceById(deviceId: string): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ deviceId });
  }

  async deleteDevice(
    deviceId: string,
    userId: string,
    jti: string,
  ): Promise<boolean> {
    const result = await this.deviceModel.deleteOne({ deviceId, userId, jti });
    return result.deletedCount > 0;
  }

  async deleteAllDevices(
    userId: string,
    currentDeviceId: string,
  ): Promise<boolean> {
    const result = await this.deviceModel.deleteMany({
      userId,
      deviceId: { $ne: currentDeviceId },
    });
    return result.deletedCount > 0;
  }

  async getSession(
    deviceId: string,
    userId: string,
    jti: string,
  ): Promise<DeviceDocument | null> {
    return this.deviceModel.findOne({ deviceId, userId, jti });
  }
}
