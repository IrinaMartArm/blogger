import { Module } from '@nestjs/common';
import { UsersController } from './api/user.controller';
import { UsersService } from './application/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './application/bcrypt.service';
import { UsersQueryRepository } from './infrastructure/users.query-repository';
import { ExternalUsersQueryRepository } from './infrastructure/external-query/external-users-query.repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
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
  controllers: [UsersController],
  providers: [
    UsersService,
    BcryptService,
    UsersRepository,
    UsersQueryRepository,
    ExternalUsersQueryRepository,
    JwtStrategy,
  ],
  exports: [ExternalUsersQueryRepository],
})
export class UserAccountsModule {}
