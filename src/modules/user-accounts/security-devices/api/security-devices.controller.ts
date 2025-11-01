import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../auth/guards/bearer/jwt-auth.guard';
import { GetUserFromRequest } from '../../decorators/param/getUserFromRequest';
import { UserContextDto } from '../../dto/user-context.dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/objectId-validation.pipe';
import { Types } from 'mongoose';
import { GetDevicesQuery } from '../infrastructure/query/get-devices.query';
import { DeleteDevicesCommand } from '../application/use-cases/delete-devices.use-case';
import { DeleteDeviceCommand } from '../application/use-cases/delete-device.use-case';

@Controller('security')
export class SecurityDevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getDevices(@GetUserFromRequest() user: UserContextDto): Promise<any> {
    return this.queryBus.execute(new GetDevicesQuery(user.currentUserId));
  }

  @Delete('devices')
  @UseGuards(JwtAuthGuard)
  async deleteDevices(
    @GetUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteDevicesCommand(user.currentUserId),
    );
  }

  @Delete('devices/:id')
  @UseGuards(JwtAuthGuard)
  async deleteDevice(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
    @GetUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteDeviceCommand(id.toString(), user.currentUserId),
    );
  }
}
