import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersRepository } from '../../../user/infrastructure/users.repository';

export class PasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private eventBus: EventBus,
    private readonly usersRepository: UsersRepository,
  ) {}
  async execute({ email }: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.find(email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'invalid email',
        extensions: [{ message: 'bad email', field: 'email' }],
      });
    }

    const result = user.setConfirmationCode();

    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'confirmation code expired or already used',
        extensions: [
          {
            message: 'confirmation code expired or already used',
            field: 'email',
          },
        ],
      });
    }
    await this.usersRepository.save(user);
    this.eventBus.publish(result.event);
  }
}
