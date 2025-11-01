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
import { Response, Request } from 'express';
import { ConfirmCodeDto } from './input-dto/login.input-dto';
import { GetUserFromRequest } from '../../decorators/param/getUserFromRequest';
import { UserContextDto } from '../../dto/user-context.dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfirmRegistrationCommand } from '../application/useCases/confirmRegistration.use-case';
import { RegistrationCommand } from '../application/useCases/registration.use-case';
import { LoginCommand } from '../application/useCases/login.use-case';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { PasswordRecoveryCommand } from '../application/useCases/passwordRecovery.use-case';
import { EmailResendingCommand } from '../application/useCases/emailResending.use-case';
import { NewPasswordCommand } from '../application/useCases/new-password.use-case';
import { CustomThrottlerGuard } from '../../../../core/guards/throttler-behind-proxy.guard';
import { GetMeQuery } from '../infrastructure/query/get-me.query';
import {
  CheckEmailDto,
  CreateUserInputDto,
  NewPasswordInputDto,
} from '../../user/api/input-dto/users.input-dto';
import { MeViewDto } from '../../user/api/view-dto/user.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { RefreshTokenCommand } from '../application/useCases/refresh-token.use-case';
import { LogoutCommand } from '../application/useCases/logout.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CustomThrottlerGuard)
  async registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomThrottlerGuard, LocalAuthGuard) // Использует дефолтные настройки: 100 запросов/минуту
  // @Throttle({ default: { limit: 10, ttl: 60000 } }) ТОЛЬКО если нужны разные лимиты для разных эндпоинтов
  async login(
    @GetUserFromRequest() user: UserContextDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    console.log('login');
    const ip =
      req.ip ||
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent: string =
      req.headers['user-agent']?.toString() || 'Unknown device';

    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginCommand(user.currentUserId, ip, userAgent));

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
  async getMe(@GetUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.queryBus.execute(new GetMeQuery(user.currentUserId));
  }

  @Get('refresh-token')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const cookies = req.cookies as { refreshToken?: string } | undefined;
    const oldRefreshToken = cookies?.refreshToken;

    if (!oldRefreshToken) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token not found',
      });
    }

    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand(oldRefreshToken));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookies = req.cookies as { refreshToken?: string } | undefined;
    const refreshToken = cookies?.refreshToken;

    if (!refreshToken) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token not found',
      });
    }

    await this.commandBus.execute(new LogoutCommand(refreshToken));

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  @Post('registration-confirmation')
  @UseGuards(CustomThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(@Body() body: ConfirmCodeDto): Promise<void> {
    return this.commandBus.execute(new ConfirmRegistrationCommand(body.code));
  }

  @Post('registration-email-resending')
  @UseGuards(CustomThrottlerGuard)
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
