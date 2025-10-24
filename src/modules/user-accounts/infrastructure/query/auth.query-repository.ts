import { Injectable } from '@nestjs/common';
import { MeViewDto } from '../../api/view-dto/user.view-dto';
import { UsersRepository } from '../users.repository';

@Injectable()
export class AuthQueryRepository {
  constructor(private readonly usersRepository: UsersRepository) {}
  async me(id: string): Promise<MeViewDto> {
    const user = await this.usersRepository.findById(id);

    return MeViewDto.mapToView(user);
  }
}
