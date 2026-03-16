import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    const { username, email, password } = body;
    return this.authService.register(username, email, password);
  }

  @Post('login')
  async login(@Body() body: { usernameOrEmail: string; password: string }) {
    const { usernameOrEmail, password } = body;
    return this.authService.login(usernameOrEmail, password);
  }
}
