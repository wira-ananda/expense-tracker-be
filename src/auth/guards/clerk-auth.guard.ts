import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Tidak ada token Clerk');
    }

    const token = authHeader.split(' ')[1];
    const clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY');

    if (!clerkSecretKey) {
      throw new UnauthorizedException('CLERK_SECRET_KEY belum di-set');
    }

    try {
      // Verifikasi token Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      if (!verifiedToken?.sub) {
        throw new UnauthorizedException('Token Clerk tidak valid');
      }

      req.clerkUser = {
        clerkId: verifiedToken.sub,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token Clerk tidak valid');
    }
  }
}
