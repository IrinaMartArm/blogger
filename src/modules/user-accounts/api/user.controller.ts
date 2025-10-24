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
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UsersService } from '../application/user.service';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { Types } from 'mongoose';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { ObjectIdValidationPipe } from '../../../core/pipes/objectId-validation.pipe';

@UseGuards(BasicAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService,
  ) {}

  @Get('/:id')
  async getById(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<UserViewDto> {
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId = await this.usersService.createUser(body);

    return await this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ObjectIdValidationPipe) id: Types.ObjectId,
  ): Promise<void> {
    return this.usersService.deleteUser(id);
  }
}
