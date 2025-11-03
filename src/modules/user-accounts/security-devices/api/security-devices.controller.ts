import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUserFromRequest } from '../../decorators/param/getUserFromRequest';
import { Types } from 'mongoose';
import { GetDevicesQuery } from '../infrastructure/query/get-devices.query';
import { DeleteDevicesCommand } from '../application/use-cases/delete-devices.use-case';
import { DeleteDeviceCommand } from '../application/use-cases/delete-device.use-case';
import { RefreshTokenGuard } from '../../auth/guards/bearer/refresh-token-auth.guard';
import { DecodedRefreshToken } from '../../auth/api/input-dto/login.input-dto';

@UseGuards(RefreshTokenGuard)
@Controller('security')
export class SecurityDevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('devices')
  async getDevices(
    @GetUserFromRequest('refresh') user: DecodedRefreshToken,
  ): Promise<any> {
    return this.queryBus.execute(new GetDevicesQuery(user.currentUserId));
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevices(
    @GetUserFromRequest('refresh') user: DecodedRefreshToken,
  ): Promise<void> {
    console.log('deleteDevices user', user);
    return this.commandBus.execute(
      new DeleteDevicesCommand(user.currentUserId, user.deviceId),
    );
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(
    @Param('id') id: Types.ObjectId,
    @GetUserFromRequest('refresh') user: DecodedRefreshToken,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteDeviceCommand(id.toString(), user.currentUserId),
    );
  }
}
