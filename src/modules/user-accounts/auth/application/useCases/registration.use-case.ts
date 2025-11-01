import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { Types } from 'mongoose';
import { BcryptService } from '../bcrypt.service';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserInputDto } from '../../../user/api/input-dto/users.input-dto';
import { User, UserModelType } from '../../../user/domain/user.entity';
import { UsersRepository } from '../../../user/infrastructure/users.repository';

export class RegistrationCommand {
  constructor(public dto: CreateUserInputDto) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase
  implements ICommandHandler<RegistrationCommand>
{
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private eventBus: EventBus,
    private readonly usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}

  async execute({ dto }: RegistrationCommand): Promise<void> {
    const existingByEmail = await this.usersRepository.find(dto.email);

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

    //async execute({ dto }: RegisterUserCommand): Promise<void> {
    //     const createdUserId = await this.commandBus.execute<
    //       CreateUserCommand,
    //       string
    //     >(new CreateUserCommand(dto)); если CreateUser тоже сделать CreateUserCommand

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'User does not exist',
      });
    }

    const result = user.setConfirmationCode();

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Email is already confirmed',
        extensions: [{ message: 'Email is already confirmed', field: 'code' }],
      });
    }
    await this.usersRepository.save(user);
    this.eventBus.publish(result.event);
  }

  private async createUser(dto: CreateUserDto): Promise<Types.ObjectId> {
    const passwordHash = await this.bcryptService.createHash(dto.password);

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    await this.usersRepository.save(user);

    return user._id;
  }
}
