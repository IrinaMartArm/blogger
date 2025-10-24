import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { SETTINGS } from '../../settings';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com', //адрес SMTP сервера
        port: 587,
        secure: false,
        auth: {
          user: SETTINGS.EMAIL,
          pass: SETTINGS.PASS,
        },
      },
      defaults: {
        from: '"App" <irinasuperdev@gmail.com>',
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
