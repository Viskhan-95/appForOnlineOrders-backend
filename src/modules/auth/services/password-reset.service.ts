import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MailerService } from '../../../common/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Без утечки информации: всегда отвечаем ок, но продолжаем только если пользователь найден
    if (!user) return;

    const token = this.tokenService.generateResetToken();
    const tokenHash = await this.passwordService.hashPassword(token);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: this.tokenService.getResetExpiresAt(),
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
      const ok = await this.passwordService.verifyPassword(token, r.tokenHash);
      if (ok) {
        matched = { id: r.id, userId: r.userId };
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Обновляем пароль, помечаем reset как использованный, инвалидируем refresh-токены
    const passwordHash = await this.passwordService.hashPassword(newPassword);

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

  // Эти методы теперь в TokenService
  // private generateResetToken(): string {
  //   const { randomBytes } = require('node:crypto');
  //   return randomBytes(32).toString('hex');
  // }

  // private getResetExpiresAt(): Date {
  //   const raw = this.config.get<string>('PASSWORD_RESET_EXPIRES') ?? '30m';
  //   const ms = require('ms');
  //   const ttlMs = ms(raw);
  //   if (typeof ttlMs !== 'number') {
  //     throw new Error('Invalid PASSWORD_RESET_EXPIRES');
  //   }
  //   return new Date(Date.now() + ttlMs);
  // }
}
