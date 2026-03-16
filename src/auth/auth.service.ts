import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}
  generateToken(userId: string) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET belum di-set');
    return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
  }

  async register(username: string, email: string, password: string) {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) throw new UnauthorizedException('Email sudah terdaftar');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    const token = this.generateToken(user.id);

    return { ...user, token };
  }

  async login(usernameOrEmail: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });
    if (!user) throw new UnauthorizedException('Akun tidak ditemukan');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Password salah');

    const token = this.generateToken(user.id);

    return { ...user, token };
  }
}
