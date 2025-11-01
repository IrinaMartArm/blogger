import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersRepository } from '../../../user/infrastructure/users.repository';

export class EmailResendingCommand {
  constructor(public email: string) {}
}

@CommandHandler(EmailResendingCommand)
export class EmailResendingUseCase
  implements ICommandHandler<EmailResendingCommand>
{
  constructor(
    private eventBus: EventBus,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ email }: EmailResendingCommand) {
    const user = await this.usersRepository.find(email);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'invalid email',
        extensions: [{ message: 'invalid email', field: 'email' }],
      });
    }

    const result = user.setConfirmationCode();
    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'confirmation code expired or already used',
        extensions: [{ message: 'Email is already confirmed', field: 'email' }],
      });
    }

    await this.usersRepository.save(user);
    this.eventBus.publish(result.event);
  }
}
