import { UsersRepository } from '../../user/infrastructure/users.repository';
import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from './bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}
  async validateUser(login: string, password: string): Promise<UserContextDto> {
    const user = await this.usersRepository.find(login);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );

    if (isPasswordValid) {
      return { currentUserId: user._id.toString() };
    }

    throw new DomainException({
      code: DomainExceptionCode.Unauthorized,
      message: 'Unauthorized',
    });
  }
}
