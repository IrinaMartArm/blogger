import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../users.query-repository';
import { Types } from 'mongoose';

export class GetUserQuery {
  constructor(public readonly id: Types.ObjectId) {}
}

@QueryHandler(GetUserQuery)
export class GetUserQueryUseCase implements IQueryHandler<GetUserQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute({ id }: GetUserQuery) {
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }
}
