import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { buildDefaultCategories } from './utils/build.default-categories';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private generateToken(userId: string) {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET belum di-set');
    }

    return jwt.sign({ id: userId }, secret, {
      expiresIn: '7d',
    });
  }

  async register(username: string, email: string, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
        },
      });

      const token = this.generateToken(user.id);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        token,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email sudah terdaftar');
      }

      console.error(error);
      throw new InternalServerErrorException('Gagal registrasi');
    }
  }

  async login(usernameOrEmail: string, password: string) {
    const cleanedInput = usernameOrEmail.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: cleanedInput.toLowerCase() }, { username: cleanedInput }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Username/email atau password salah');
    }

    const token = this.generateToken(user.id);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return user;
  }

  async clerkSync(clerkId: string, username: string, email: string) {
    try {
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedUsername = username.trim();

      // Cek apakah user dengan clerkId sudah ada
      let user = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (user) {
        // User sudah ada, return data user
        return {
          id: user.id,
          clerkId: user.clerkId,
          username: user.username,
          email: user.email,
        };
      }

      // Cek apakah ada user dengan email yang sama (user lama yang belum punya clerkId)
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: cleanedEmail },
      });

      if (existingUserByEmail) {
        // Hubungkan user lama dengan clerkId
        user = await this.prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            clerkId,
            username: cleanedUsername, // Update username jika berbeda
          },
        });

        return {
          id: user.id,
          clerkId: user.clerkId,
          username: user.username,
          email: user.email,
        };
      }

      // Buat user baru
      user = await this.prisma.user.create({
        data: {
          clerkId,
          username: cleanedUsername,
          email: cleanedEmail,
          password: null,
        },
      });

      // Buat default categories untuk user baru
      const defaultCategories = buildDefaultCategories(user.id);
      await this.prisma.category.createMany({
        data: defaultCategories,
      });

      return {
        id: user.id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      console.error('Error saat clerk sync:', error);
      throw new InternalServerErrorException('Gagal sinkronisasi user Clerk');
    }
  }

  async updateClerkProfile(clerkId: string, phoneNumber?: string) {
    try {
      // Cari user berdasarkan clerkId
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // Update phone number
      const cleanedPhoneNumber = phoneNumber?.trim() || null;

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          phoneNumber: cleanedPhoneNumber,
        },
        select: {
          id: true,
          clerkId: true,
          username: true,
          email: true,
          phoneNumber: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Error saat update profile:', error);
      throw new InternalServerErrorException('Gagal update profile');
    }
  }
}
