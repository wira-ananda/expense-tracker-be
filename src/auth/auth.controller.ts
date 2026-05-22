import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ClerkSyncDto } from './dto/clerk-sync.dto';
import { UpdateClerkProfileDto } from './dto/update-clerk-profile.dto';
import { AuthMiddleware } from './auth.middleware';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorator/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrasi user baru' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registrasi berhasil',
    schema: {
      example: {
        id: '0f7c31d9-4d29-4cf4-93e3-6c7e64a5f8f0',
        username: 'Lia',
        email: 'lia@wmail.com',
        token: 'jwt-token',
      },
    },
  })
  async register(@Body() body: RegisterDto) {
    const { username, email, password } = body;
    return this.authService.register(username, email, password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login berhasil',
    schema: {
      example: {
        id: '0f7c31d9-4d29-4cf4-93e3-6c7e64a5f8f0',
        username: 'Lia',
        email: 'lia@wmail.com',
        token: 'jwt-token',
      },
    },
  })
  async login(@Body() body: LoginDto) {
    const { usernameOrEmail, password } = body;
    return this.authService.login(usernameOrEmail, password);
  }

  @Get('me')
  @UseGuards(AuthMiddleware)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil data user yang sedang login' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data user',
    schema: {
      example: {
        id: '0f7c31d9-4d29-4cf4-93e3-6c7e64a5f8f0',
        username: 'Lia',
        email: 'lia@wmail.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token tidak valid',
        error: 'Unauthorized',
      },
    },
  })
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  @Post('clerk/sync')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sinkronisasi user Clerk ke database lokal' })
  @ApiBody({ type: ClerkSyncDto })
  @ApiResponse({
    status: 201,
    description: 'Sinkronisasi berhasil',
    schema: {
      example: {
        id: '0f7c31d9-4d29-4cf4-93e3-6c7e64a5f8f0',
        clerkId: 'user_2abc123xyz',
        username: 'johndoe',
        email: 'john@example.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token Clerk tidak valid',
        error: 'Unauthorized',
      },
    },
  })
  async clerkSync(@Req() req: any, @Body() body: ClerkSyncDto) {
    const { clerkId } = req.clerkUser;
    const { username, email } = body;
    return this.authService.clerkSync(clerkId, username, email);
  }

  @Patch('clerk/profile')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile user Clerk (data lokal)' })
  @ApiBody({ type: UpdateClerkProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile berhasil diupdate',
    schema: {
      example: {
        id: '0f7c31d9-4d29-4cf4-93e3-6c7e64a5f8f0',
        clerkId: 'user_2abc123xyz',
        username: 'johndoe',
        email: 'john@example.com',
        phoneNumber: '081234567890',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Token Clerk tidak valid',
        error: 'Unauthorized',
      },
    },
  })
  async updateClerkProfile(
    @Req() req: any,
    @Body() body: UpdateClerkProfileDto,
  ) {
    const { clerkId } = req.clerkUser;
    const { phoneNumber } = body;
    return this.authService.updateClerkProfile(clerkId, phoneNumber);
  }
}
