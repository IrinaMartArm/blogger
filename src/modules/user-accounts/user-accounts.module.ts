import { Module } from '@nestjs/common';
import { UsersController } from './api/user.controller';
import { UsersService } from './application/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './application/bcrypt.service';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { ExternalUsersQueryRepository } from './infrastructure/external-query/external-users-query.repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local/local.strategy';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../notifications/email.service';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { ConfirmRegistrationUseCase } from './application/useCases/confirmRegistration.use-case';
import { RegistrationUseCase } from './application/useCases/registration.use-case';
import { UserRegisteredHandler } from './application/events/userRegistered.event';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/token.constants';
import { NewPasswordUseCase } from './application/useCases/new-password.use-case';
import { EmailResendingUseCase } from './application/useCases/emailResending.use-case';
import { PasswordRecoveryUseCase } from './application/useCases/passwordRecovery.use-case';
import { LoginUseCase } from './application/useCases/login.use-case';
// import { ConfigModule, ConfigService } from '@nestjs/config';

const CommandHandlers = [
  RegistrationUseCase,
  LoginUseCase,
  ConfirmRegistrationUseCase,
  NewPasswordUseCase,
  EmailResendingUseCase,
  PasswordRecoveryUseCase,
];
const EventHandlers = [UserRegisteredHandler];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    NotificationsModule,
    //NestJS предоставляет модуль JwtModule (из пакета @nestjs/jwt), который нужен, чтобы:
    // создавать токены (this.jwtService.sign(payload));
    // проверять токены
    //когда данные известны заранее:
    JwtModule.register({
      secret: '',
      signOptions: { expiresIn: '10m' },
    }),
    //настройки берутся из других модулей, например из ConfigModule, чтобы не хардкодить значения.
    // JwtModule.registerAsync({
    //   imports: [ConfigModule], перед регистрацией JwtModule нужно подключить ConfigModule,
    // чтобы ConfigService был доступен внутри useFactory.
    //   inject: [ConfigService], Указываем, что в функцию useFactory нужно «внедрить» экземпляр ConfigService.
    //   useFactory: (cfg: ConfigService) => ({
    //   secret: cfg.get<string>('JWT_SECRET'), достаём переменную окружения JWT_SECRET из .env через ConfigService
    //   signOptions: { expiresIn: '1h' }, }),
    //   фабричная функция — она вызывается при инициализации модуля.
    // NestJS передаёт в неё ConfigService,
    // и результат этой функции — объект настроек для JwtModule.
    // }),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    BcryptService,
    AuthService,
    EmailService,
    UsersRepository,
    UsersQueryRepository,
    AuthQueryRepository,
    ExternalUsersQueryRepository,
    JwtStrategy,
    LocalStrategy,
    ...CommandHandlers,
    ...EventHandlers,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'access-token-secret', //TODO: move to env. will be in the following lessons
          signOptions: { expiresIn: '5m' },
        });
      },
      inject: [
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (): JwtService => {
        return new JwtService({
          secret: 'refresh-token-secret', //TODO: move to env. will be in the following lessons
          signOptions: { expiresIn: '10m' },
        });
      },
      inject: [
        /*TODO: inject configService. will be in the following lessons*/
      ],
    },
  ],
  exports: [ExternalUsersQueryRepository],
})
export class UserAccountsModule {}
