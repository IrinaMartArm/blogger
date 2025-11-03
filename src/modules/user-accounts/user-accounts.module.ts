import { Module } from '@nestjs/common';

import { JwtStrategy } from './auth/guards/bearer/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { LocalStrategy } from './auth/guards/local/local.strategy';
import { AuthController } from './auth/api/auth.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../notifications/email.service';
import { ConfirmRegistrationUseCase } from './auth/application/useCases/confirmRegistration.use-case';
import { RegistrationUseCase } from './auth/application/useCases/registration.use-case';

import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/token.constants';
import { NewPasswordUseCase } from './auth/application/useCases/new-password.use-case';
import { EmailResendingUseCase } from './auth/application/useCases/emailResending.use-case';
import { PasswordRecoveryUseCase } from './auth/application/useCases/passwordRecovery.use-case';
import { LoginUseCase } from './auth/application/useCases/login.use-case';
import { UserAccountsConfig } from './user-accounts.config';
import { Device, DeviceSchema } from './security-devices/domain/device.entity';
import { SecurityDevicesController } from './security-devices/api/security-devices.controller';
import { DeleteUserUseCase } from './user/application/useCases/delete-user.use-case';
import { DeleteDevicesUseCase } from './security-devices/application/use-cases/delete-device.use-case';
import { DeleteDeviceUseCase } from './security-devices/application/use-cases/delete-devices.use-case';
import { GetDevicesQueryHandler } from './security-devices/infrastructure/query/get-devices.query';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/domain/user.entity';
import { UsersController } from './user/api/user.controller';
import { BcryptService } from './auth/application/bcrypt.service';
import { UsersRepository } from './user/infrastructure/users.repository';
import { UsersQueryRepository } from './user/infrastructure/users.query-repository';
import { ExternalUsersQueryRepository } from './user/infrastructure/external-query/external-users-query.repository';
import { DevicesQueryRepository } from './security-devices/infrastructure/devices.query-repository';
import { UserRegisteredHandler } from './user/application/events/userRegistered.event';
import { AuthService } from './auth/application/auth.service';
import { DevicesRepository } from './security-devices/infrastructure/devices.repository';
import { RefreshTokenUseCase } from './auth/application/useCases/refresh-token.use-case';
import { GetUsersHandler } from './user/infrastructure/query/get-users.query';
import { AuthQueryRepository } from './auth/infrastructure/auth.query-repository';
import { GetMeHandler } from './auth/infrastructure/query/get-me.query';
import { CreateUserUseCase } from './user/application/useCases/create-user.use-case';
import { GetUserQueryUseCase } from './user/infrastructure/query/get-user.query';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtRefreshStrategy } from './auth/guards/bearer/refresh.strategy';
import { LogoutUseCase } from './auth/application/useCases/logout.use-case';

const CommandHandlers = [
  LogoutUseCase,
  ConfirmRegistrationUseCase,
  EmailResendingUseCase,
  LoginUseCase,
  NewPasswordUseCase,
  PasswordRecoveryUseCase,
  RefreshTokenUseCase,
  RegistrationUseCase,
  DeleteDevicesUseCase,
  DeleteDeviceUseCase,
  CreateUserUseCase,
  DeleteUserUseCase,
];
const EventHandlers = [UserRegisteredHandler];
const QueryHandlers = [
  GetDevicesQueryHandler,
  GetUserQueryUseCase,
  GetUsersHandler,
  GetMeHandler,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
    CqrsModule,
    PassportModule,
    NotificationsModule,
    JwtModule,
    //настройки берутся из других модулей, например из ConfigModule, чтобы не хардкодить значения.
    // JwtModule.registerAsync({
    //   imports: [ConfigModule], //перед регистрацией JwtModule нужно подключить ConfigModule,
    //   //чтобы ConfigService был доступен внутри useFactory.
    //   inject: [ConfigService], //Указываем, что в функцию useFactory нужно «внедрить» экземпляр ConfigService.
    //   useFactory: (cfg: ConfigService) => ({
    //     secret: cfg.get<string>('JWT_SECRET'), //достаём переменную окружения JWT_SECRET из .env через ConfigService
    //     signOptions: { expiresIn: '1h' },
    //   }),
    //фабричная функция — она вызывается при инициализации модуля.
    //NestJS передаёт в неё ConfigService,
    //и результат этой функции — объект настроек для JwtModule.
    // }),
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UserAccountsConfig,
    AuthService,
    AuthQueryRepository,
    BcryptService,
    EmailService,
    UsersRepository,
    UsersQueryRepository,
    DevicesRepository,
    DevicesQueryRepository,
    ExternalUsersQueryRepository,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (config: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: config.accessTokenSecret,
          signOptions: {
            expiresIn: config.accessTokenExpireIn,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (config: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: config.refreshTokenSecret,
          signOptions: { expiresIn: config.refreshTokenExpireIn },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
  exports: [ExternalUsersQueryRepository],
})
export class UserAccountsModule {}
