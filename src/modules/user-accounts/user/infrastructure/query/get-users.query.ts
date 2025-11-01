import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { UserViewDto } from '../../api/view-dto/user.view-dto';
import { UsersQueryRepository } from '../users.query-repository';

export class GetUsersQuery {
  constructor(public readonly queryParams: GetUsersQueryParams) {}
}

@QueryHandler(GetUsersQuery)
export class GetUsersHandler
  implements IQueryHandler<GetUsersQuery, PaginatedViewDto<UserViewDto[]>>
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute({
    queryParams,
  }: GetUsersQuery): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(queryParams);
  }
}
