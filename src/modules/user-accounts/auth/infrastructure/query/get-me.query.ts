import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MeViewDto } from '../../../user/api/view-dto/user.view-dto';
import { UsersQueryRepository } from '../../../user/infrastructure/users.query-repository';
import { Types } from 'mongoose';

export class GetMeQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, MeViewDto> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute({ userId }: GetMeQuery): Promise<MeViewDto> {
    return this.usersQueryRepository.getMe(new Types.ObjectId(userId));
  }
}
