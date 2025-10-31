import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: configService.get<string>('EMAIL'),
            pass: configService.get<string>('PASSWORD'),
          },
        },
        defaults: {
          from: `"App" <${configService.get<string>('MY_EMAIL')}>`,
        },
      }),
    }),
  ],
  providers: [EmailService, ConfigService],
  exports: [EmailService],
})
export class NotificationsModule {}
