import { Module } from '@nestjs/common';
import { UsersController } from './api/user.controller';
import { UsersService } from './application/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { BcryptService } from './application/bcrypt.service';
import { UsersQueryRepository } from './infrastructure/users.query-repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    BcryptService,
    UsersRepository,
    UsersQueryRepository,
  ],
})
export class UserAccountsModule {}
