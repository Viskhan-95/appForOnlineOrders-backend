import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import type { RegisterInput, LoginInput } from './auth.zod';
import { PrismaService } from '../../../prisma/prisma.service';

// Новые сервисы
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { PasswordResetService } from './services/password-reset.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Электронная почта уже используется');
    }

    const passwordHash = await this.passwordService.hashPassword(
      input.password,
    );

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        phone: input.phone,
        role: input.role ?? 'USER',
        address: input.address ?? null,
        avatar: input.avatar ?? null,
        restaurantId: input.restaurantId ?? null,
      },
    });

    const tokens = await this.tokenService.signTokens({
      userId: user.id,
      email: user.email,
    });

    await this.refreshTokenService.saveRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
    });

    return {
      user: this.passwordService.getSafeUser(user),
      ...tokens,
    };
  }

  async login(
    input: LoginInput,
    meta?: { ua?: string | null; ip?: string | null },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        avatar: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true,
      },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const isValid = await this.passwordService.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedException('Неверные учетные данные');

    const safeUser = this.passwordService.getSafeUser(user);
    const tokens = await this.tokenService.signTokens({
      userId: safeUser.id,
      email: safeUser.email,
    });

    await this.refreshTokenService.saveRefreshToken({
      userId: safeUser.id,
      refreshToken: tokens.refreshToken,
      userAgent: meta?.ua ?? null,
      ip: meta?.ip ?? null,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
    });

    return { user: safeUser, ...tokens };
  }

  async refresh(
    refreshToken: string,
    meta?: { ua?: string | null; ip?: string | null },
  ) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      const match = await this.refreshTokenService.findMatchingRefreshToken(
        payload.sub,
        refreshToken,
      );
      if (!match) throw new UnauthorizedException('Invalid refresh token');

      await this.refreshTokenService.revokeRefreshToken(match.id);

      const tokens = await this.tokenService.signTokens({
        userId: payload.sub,
        email: payload.email,
      });

      await this.refreshTokenService.saveRefreshToken({
        userId: payload.sub,
        refreshToken: tokens.refreshToken,
        userAgent: meta?.ua ?? null,
        ip: meta?.ip ?? null,
        expiresAt: this.tokenService.getRefreshExpiresAt(),
      });

      return { ...tokens };
    } catch (error) {
      // Логируем ошибку для отладки, но не раскрываем детали пользователю
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  async requestReset(email: string): Promise<void> {
    await this.passwordResetService.requestReset(email);
  }

  async resetConfirm(token: string, newPassword: string): Promise<void> {
    await this.passwordResetService.resetConfirm(token, newPassword);
  }
}
