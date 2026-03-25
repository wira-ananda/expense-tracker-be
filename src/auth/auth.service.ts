import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { buildDefaultCategories } from './utils/build.default-categories';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  generateToken(userId: string) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET belum di-set');

    return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
  }

  async login(usernameOrEmail: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Akun tidak ditemukan');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password salah');
    }

    const token = this.generateToken(user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    };
  }

  async register(username: string, email: string, password: string) {
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (userExists?.email === email) {
      throw new ConflictException('Email sudah terdaftar');
    }

    if (userExists?.username === username) {
      throw new ConflictException('Username sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      const defaultCategories = buildDefaultCategories(newUser.id);

      await tx.category.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });

      return newUser;
    });

    const token = this.generateToken(user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      token,
    };
  }
}
