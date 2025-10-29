import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'Express';
import {
  CheckEmailDto,
  CreateUserInputDto,
  NewPasswordInputDto,
} from './input-dto/users.input-dto';
import { ConfirmCodeDto } from './input-dto/login.input-gto';
import { GetUserFromRequest } from '../decorators/param/getUserFromRequest';
import { UserContextDto } from '../dto/user-context.dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { ConfirmRegistrationCommand } from '../application/useCases/confirmRegistration.use-case';
import { RegistrationCommand } from '../application/useCases/registration.use-case';
import { LoginCommand } from '../application/useCases/login.use-case';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { PasswordRecoveryCommand } from '../application/useCases/passwordRecovery.use-case';
import { EmailResendingCommand } from '../application/useCases/emailResending.use-case';
import { NewPasswordCommand } from '../application/useCases/new-password.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @GetUserFromRequest() user: UserContextDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const deviseId: string =
      req.headers['user-agent']?.toString() || 'Unknown device';

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginCommand(user.currentUserId, ip, deviseId));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // true, если HTTPS
      sameSite: 'strict', //чтобы токен не утекал на другие сайты
      maxAge: 20 * 1000, //чтобы кука жила столько же, сколько refreshToken
      path: '/', // путь, где кука будет доступна
    });

    return { accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUserFromRequest() user: UserContextDto) {
    return this.authQueryRepository.me(user.currentUserId);
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(@Body() body: ConfirmCodeDto): Promise<void> {
    return this.commandBus.execute(new ConfirmRegistrationCommand(body.code));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() body: CheckEmailDto): Promise<void> {
    return this.commandBus.execute(new EmailResendingCommand(body.email));
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: CheckEmailDto): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.commandBus.execute(
      new NewPasswordCommand({
        newPassword: body.newPassword,
        recoveryCode: body.recoveryCode,
      }),
    );
  }
}
