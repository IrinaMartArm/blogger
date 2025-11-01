import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UsersRepository } from '../../../user/infrastructure/users.repository';

export class ConfirmRegistrationCommand {
  constructor(public readonly code: string) {}
}

@CommandHandler(ConfirmRegistrationCommand)
export class ConfirmRegistrationUseCase
  implements ICommandHandler<ConfirmRegistrationCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ code }: ConfirmRegistrationCommand): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid confirmation code',
        extensions: [{ message: 'Invalid confirmation code', field: 'code' }],
      });
    }

    const isConfirmed = user.confirmEmail(code);

    if (!isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired or already used',
        extensions: [
          {
            message: 'confirmation code expired or already used',
            field: 'email',
          },
        ],
      });
    }

    await this.usersRepository.save(user);
  }
}
