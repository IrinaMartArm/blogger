import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../application/user.service';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { LoginInputDto } from './input-dto/login.input-gto';
import { AuthService } from '../application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('registration')
  async registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.usersService.registration(body);
  }

  // @Post('login')
  // async login(@Body() user: LoginInputDto): Promise<{ accessToken: string }> {}
}
