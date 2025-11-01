import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CreateUserInputDto } from '../../api/input-dto/users.input-dto';
import { BcryptService } from '../../../auth/application/bcrypt.service';
import { User, UserModelType } from '../../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private readonly usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}

  async execute({ dto }: CreateUserCommand) {
    const userByEmail = await this.usersRepository.find(dto.email);

    if (userByEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User already exists',
        extensions: [{ message: 'User already exists', field: 'email' }],
      });
    }

    const userByLogin = await this.usersRepository.find(dto.login);

    if (userByLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User already exists',
        extensions: [{ message: 'User already exists', field: 'login' }],
      });
    }

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
