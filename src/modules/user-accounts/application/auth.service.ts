import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { BcryptService } from './bcrypt.service';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.find(username);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return null;
    }
    return { id: user._id.toString() };
  }
}
