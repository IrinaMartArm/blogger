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
import { Request, Response } from 'express';
import {
  ConfirmCodeDto,
  DecodedRefreshToken,
} from './input-dto/login.input-dto';
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
import { RefreshTokenGuard } from '../guards/bearer/refresh-token-auth.guard';

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

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const payload = req.user as DecodedRefreshToken;
    if (!payload) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorized',
      });
    }

    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand(payload));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const payload = req.user as DecodedRefreshToken;

    if (!payload) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Refresh token not found',
      });
    }

    await this.commandBus.execute(new LogoutCommand(payload));

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.status(HttpStatus.NO_CONTENT).send();
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
