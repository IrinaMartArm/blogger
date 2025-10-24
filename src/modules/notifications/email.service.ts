import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { emailExamples } from './email-examples';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    console.log('EmailService sendConfirmationEmail email', email);
    await this.mailerService.sendMail({
      to: email,
      from: '"Support" <irinasuperdev@gmail.com>',
      text: emailExamples.registrationEmail(code),
    });
  }

  async sendRecoveryEmail(email: string, code: string): Promise<void> {
    console.log('EmailService sendRecoveryEmail');
    await this.mailerService.sendMail({
      to: email,
      text: emailExamples.passwordRecoveryEmail(code),
    });
  }
}
