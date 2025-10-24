import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { BcryptService } from './bcrypt.service';
import { Types } from 'mongoose';
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
    const existingByEmail = await this.usersRepository.find(dto.email);
    console.log('UsersService registration');
    if (existingByEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User already exists',
        extensions: [{ message: 'User already exists', field: 'email' }],
      });
    }

    const existingByLogin = await this.usersRepository.find(dto.login);

    if (existingByLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User already exists',
        extensions: [{ message: 'User already exists', field: 'login' }],
      });
    }

    const userId = await this.createUser(dto);

    console.log('UsersService registration, userId', userId);

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'User does not exist',
      });
    }

    const code = user.setConfirmationCode();

    console.log('UsersService registration code', code);
    if (!code) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email is already confirmed',
        extensions: [{ message: 'Email is already confirmed', field: 'code' }],
      });
    }
    await this.usersRepository.save(user);

    console.log('UsersService registration user.email', user.email);

    try {
      console.log('UsersService registration emailService');
      await this.emailService.sendConfirmationEmail(user.email, code);
    } catch (e: unknown) {
      console.log('ERROR', e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Send email error',
      });
    }
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
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User does not exist',
      });
    }

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
