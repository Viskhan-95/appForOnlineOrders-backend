import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { RegisterInput, LoginInput } from './auth.zod';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
type JwtPayload = { sub: string; email: string };
import ms, { type StringValue } from 'ms';
import { MailerService } from '../../common/mailer/mailer.service';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  private getRefreshExpiresAt(): Date {
    const refreshTtl = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const msFn: (v: string) => number | undefined = ms as unknown as (
      v: string,
    ) => number | undefined;
    const ttlMs = msFn(refreshTtl);
    if (typeof ttlMs !== 'number') {
      throw new Error('Invalid JWT_REFRESH_EXPIRES format');
    }
    return new Date(Date.now() + ttlMs);
  }

  // Хэшируем и сохраняем refresh-токен в БД
  private async saveRefreshToken(args: {
    userId: string;
    refreshToken: string;
    userAgent?: string | null;
    ip?: string | null;
  }): Promise<void> {
    const hashed = await bcrypt.hash(args.refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: args.userId,
        hashed,
        userAgent: args.userAgent ?? null,
        ip: args.ip ?? null,
        expiresAt: this.getRefreshExpiresAt(),
      },
    });
  }

  // Помечаем ВСЕ активные refresh пользователя как отозванные (logout-all)
  private async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // Ищем подходящий refresh в БД и сравниваем по хэшу
  private async findMatchingRefreshToken(userId: string, rawToken: string) {
    const candidates = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    for (const token of candidates) {
      const ok = await bcrypt.compare(rawToken, token.hashed);
      if (ok) return token;
    }
    return null;
  }

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Электронная почта уже используется');
    }

    const passwordHash = await this.hashPassword(input.password);

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

    const tokens = await this.signTokens({
      userId: user.id,
      email: user.email,
    });

    await this.saveRefreshToken({
      userId: user.id,
      refreshToken: tokens.refreshToken,
    });

    return {
      user,
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

    const isValid = await this.verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedException('Неверные учетные данные');

    const { passwordHash: _pw, ...publicUser } = user;
    const tokens = await this.signTokens({
      userId: publicUser.id,
      email: publicUser.email,
    });

    await this.saveRefreshToken({
      userId: publicUser.id,
      refreshToken: tokens.refreshToken,
      userAgent: meta?.ua ?? null,
      ip: meta?.ip ?? null,
    });

    return { user: publicUser, ...tokens };
  }

  // ——— helpers ———

  private async hashPassword(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  private async signTokens(args: { userId: string; email: string }) {
    const payload: JwtPayload = { sub: args.userId, email: args.email };

    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET', '');
    const accessExpiresIn = this.config.get<string>(
      'JWT_ACCESS_EXPIRES',
      '15m',
    );

    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET', '');
    const refreshExpiresIn = this.config.get<string>(
      'JWT_REFRESH_EXPIRES',
      '7d',
    );

    const accessToken = await this.jwt.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  private getSafeUser<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async refresh(
    refreshToken: string,
    meta?: { ua?: string | null; ip?: string | null },
  ) {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
      }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', ''),
      });

      // Найти соответствующий refresh в БД
      const match = await this.findMatchingRefreshToken(
        payload.sub,
        refreshToken,
      );
      if (!match) throw new UnauthorizedException('Invalid refresh token');

      // Отозвать найденный (ротация)
      await this.prisma.refreshToken.update({
        where: { id: match.id },
        data: { revokedAt: new Date() },
      });

      // Выдать новую пару и сохранить новый refresh
      const tokens = await this.signTokens({
        userId: payload.sub,
        email: payload.email,
      });
      await this.saveRefreshToken({
        userId: payload.sub,
        refreshToken: tokens.refreshToken,
        userAgent: meta?.ua ?? null,
        ip: meta?.ip ?? null,
      });

      return { ...tokens };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.revokeAllUserRefreshTokens(userId);
  }

  private getResetExpiresAt(): Date {
    // срок жизни токена сброса, по умолчанию 30 минут
    const raw = this.config.get<string>('PASSWORD_RESET_EXPIRES') ?? '30m';
    const ttlMs = ms(raw as StringValue);
    if (typeof ttlMs !== 'number')
      throw new Error('Invalid PASSWORD_RESET_EXPIRES');
    return new Date(Date.now() + ttlMs);
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex'); // 64 hex chars
  }

  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    // Без утечки информации: всегда отвечаем ок, но продолжаем только если пользователь найден
    if (!user) return;

    const token = this.generateResetToken();
    const tokenHash = await bcrypt.hash(token, 10);
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: this.getResetExpiresAt(),
      },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.mailer.sendPasswordReset(user.email, link);
  }

  async resetConfirm(token: string, newPassword: string): Promise<void> {
    // Находим все активные запросы и ищем совпадение по хэшу
    const candidates = await this.prisma.passwordReset.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matched: { id: string; userId: string } | null = null;
    for (const r of candidates) {
      const ok = await bcrypt.compare(token, r.tokenHash);
      if (ok) {
        matched = { id: r.id, userId: r.userId };
        break;
      }
    }
    if (!matched)
      throw new UnauthorizedException('Invalid or expired reset token');

    // Обновляем пароль, помечаем reset как использованный, инвалидируем refresh-токены
    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: matched.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: matched.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: matched.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
