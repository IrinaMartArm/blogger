import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { BcryptService } from './bcrypt.service';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { LoginInputDto } from '../api/input-dto/login.input-gto';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { SETTINGS } from '../../../settings';
import { EmailService } from '../../notifications/email.service';
import { NewPasswordInputDto } from '../api/input-dto/users.input-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(body: LoginInputDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(body.loginOrEmail, body.password);

    const accessToken = this.jwtService.sign(
      { userId: user.currentUserId },
      { secret: SETTINGS.JWT_ACCESS_SECRET },
    );

    return {
      accessToken,
    };
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);
    console.log('AuthService registration-confirmation');
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid confirmation code',
        extensions: [{ message: 'Invalid confirmation code', field: 'code' }],
      });
    }

    const isConfirmed = user.confirmEmail(code);

    if (!isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired or already used',
        extensions: [
          {
            message: 'confirmation code expired or already used',
            field: 'email',
          },
        ],
      });
    }

    await this.usersRepository.save(user);
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserContextDto> {
    const user = await this.usersRepository.find(username);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'User does not exist',
      });
    }
    const isPasswordValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Invalid login or password',
      });
    }
    return { currentUserId: user._id.toString() };
  }

  async passwordRecovery(email: string) {
    const user = await this.usersRepository.find(email);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'invalid email',
        extensions: [{ message: 'bad email', field: 'email' }],
      });
    }

    const code = user.setConfirmationCode(true);
    if (!code) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'confirmation code expired or already used',
        extensions: [
          {
            message: 'confirmation code expired or already used',
            field: 'email',
          },
        ],
      });
    }
    await this.usersRepository.save(user);

    try {
      await this.emailService.sendRecoveryEmail(user.email, code);
    } catch (e: unknown) {
      console.log('ERROR', e);
      // await usersRepository.deleteUser(userId);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Send email error',
      });
    }
  }

  async setNewPassword(dto: NewPasswordInputDto) {
    const user = await this.usersRepository.findByConfirmationCode(
      dto.recoveryCode,
    );
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid confirmation code',
        extensions: [{ message: 'invalid code', field: 'code' }],
      });
    }

    const canChange = user.canChangePassword(dto.recoveryCode);
    if (!canChange) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Confirmation code expired or already used',
        extensions: [
          {
            message: 'Confirmation code expired or already used',
            field: 'code',
          },
        ],
      });
    }

    const passwordHash = await this.bcryptService.createHash(dto.newPassword);
    user.changePassword(passwordHash);
    await this.usersRepository.save(user);
  }

  async emailResending(email: string) {
    const user = await this.usersRepository.find(email);

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'invalid email',
        extensions: [{ message: 'invalid email', field: 'email' }],
      });
    }

    const code = user.setConfirmationCode();
    if (!code) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'confirmation code expired or already used',
        extensions: [{ message: 'Email is already confirmed', field: 'email' }],
      });
    }

    await this.usersRepository.save(user);

    try {
      await this.emailService.sendConfirmationEmail(user.email, code);
    } catch (e: unknown) {
      console.log('ERROR', e);
      // await usersRepository.deleteUser(userId);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Send email error',
      });
    }
  }
}
