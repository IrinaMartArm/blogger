import { NewPasswordInputDto } from '../../api/input-dto/users.input-dto';
import { ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from '../bcrypt.service';

export class NewPasswordCommand {
  constructor(public dto: NewPasswordInputDto) {}
}

export class NewPasswordUseCase implements ICommandHandler<NewPasswordCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({ dto }: NewPasswordCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(
      dto.recoveryCode,
    );
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid confirmation code',
        extensions: [{ message: 'invalid code', field: 'code' }],
      });
    }

    const canChange = user.canChangePassword(dto.recoveryCode);
    if (!canChange) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired or already used',
        extensions: [
          {
            message: 'Confirmation code expired or already used',
            field: 'code',
          },
        ],
      });
    }

    const passwordHash = await this.bcryptService.createHash(dto.newPassword);
    user.changePassword(passwordHash);
    await this.usersRepository.save(user);
  }
}
