import { DeviceDocument } from '../../domain/device.entity';

export class DevicesViewDto {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;

  static mapToView(dto: DeviceDocument): DevicesViewDto {
    const device = new DevicesViewDto();

    device.deviceId = dto.deviceId;
    device.ip = dto.ip;
    device.title = dto.userAgent;
    device.lastActiveDate = dto.lastActive.toString();

    return device;
  }
}
