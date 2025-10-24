import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { emailExamples } from './email-examples';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      from: '"Support" <irinasuperdev@gmail.com>',
      to: email,
      html: emailExamples.registrationEmail(code),
    });
  }

  async sendRecoveryEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      from: '"Support" <irinasuperdev@gmail.com>',
      html: emailExamples.passwordRecoveryEmail(code),
    });
  }
}
