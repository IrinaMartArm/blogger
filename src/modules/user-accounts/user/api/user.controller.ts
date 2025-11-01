import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { UserViewDto } from './view-dto/user.view-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { Types } from 'mongoose';
import { ObjectIdValidationPipe } from '../../../../core/pipes/objectId-validation.pipe';
import { BasicAuthGuard } from '../../auth/guards/basic/basic-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/useCases/create-user.use-case';
import { DeleteUserCommand } from '../application/useCases/delete-user.use-case';
import { GetUsersQuery } from '../infrastructure/query/get-users.query';
import { GetUserQuery } from '../infrastructure/query/get-user.query';

@UseGuards(BasicAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private commandBus: CommandBus,
    private queryBuss: QueryBus,
  ) {}

  @Get('/:id')
  async getById(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<UserViewDto> {
    return this.queryBuss.execute(new GetUserQuery(id));
  }

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.queryBuss.execute(new GetUsersQuery(query));
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId: Types.ObjectId = await this.commandBus.execute(
      new CreateUserCommand(body),
    );

    return this.queryBuss.execute(new GetUserQuery(userId));
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
