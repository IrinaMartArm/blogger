import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UserViewDto } from '../../api/view-dto/user.view-dto';

@Injectable()
export class ExternalUsersQueryRepository {
  constructor(@InjectModel(User.name) private userModel: UserModelType) {}
  async findUserOrFail(id: string): Promise<UserViewDto> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserViewDto.mapToView(user);
  }

  async findUsersByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .select('_id login')
      .lean();

    return new Map(users.map((user) => [user._id.toString(), user.login]));
  }
}
