import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    const passwordHash = await this.bcryptService.createHash(dto.password);

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  // async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
  //   const user = await this.usersRepository.find(id);
  //
  //   if (!user) {
  //     throw new NotFoundException('user not found');
  //   }
  //
  //   user.update(dto);
  //
  //   await this.usersRepository.save(user);
  //
  //   return user._id.toString();
  // }

  async deleteUser(id: string) {
    const user = await this.usersRepository.find(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
