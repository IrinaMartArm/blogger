import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../../../notifications/email.service';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainEvent } from '../../domain/event/domane.event';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public email: string,
    public code: string,
    public passwordRecovery?: boolean,
  ) {
    super();
  }
  getName(): string {
    return 'UserRegisteredEvent';
  }
}

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    try {
      if (event.passwordRecovery) {
        await this.emailService.sendRecoveryEmail(event.email, event.code);
      } else {
        await this.emailService.sendConfirmationEmail(event.email, event.code);
      }
    } catch (e: unknown) {
      console.error(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Send email error',
      });
    }
  }
}
