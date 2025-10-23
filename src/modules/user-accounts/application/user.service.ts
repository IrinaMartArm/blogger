import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { EmailService } from '../../notifications/email.service';

@Injectable()
export class UsersService {
  constructor(
    //инжектирование модели в сервис через DI
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
    private emailService: EmailService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<Types.ObjectId> {
    const passwordHash = await this.bcryptService.createHash(dto.password);

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return user._id;
  }

  async registration(dto: CreateUserDto): Promise<void> {
    const userId = await this.createUser(dto);

    const confirmCode = randomUUID();

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'User does not exist',
      });
    }
    user.confirmationCode = confirmCode;
    user.expirationDate = add(new Date(), { hours: 1, minutes: 30 });

    try {
      await this.emailService.sendConfirmationEmail(
        user.email,
        user.confirmationCode,
      );
    } catch (e: unknown) {
      console.log(e);
      // await usersRepository.deleteUser(userId);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Send email error',
      });
    }
    await user.save();
  }

  async updateUser(
    id: Types.ObjectId,
    dto: UpdateUserDto,
  ): Promise<Types.ObjectId> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    user.update(dto);

    await this.usersRepository.save(user);

    return user._id;
  }

  async deleteUser(id: Types.ObjectId) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
