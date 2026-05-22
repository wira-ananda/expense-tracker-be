// auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './auth.middleware';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

@Module({
  imports: [ConfigModule],
  providers: [AuthService, AuthMiddleware, ClerkAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthMiddleware, ClerkAuthGuard],
})
export class AuthModule {}
