import { Injectable } from '@nestjs/common';
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

  // Ссылочный сценарий удалён. Остаётся только метод ниже, используемый OTP-потоком

  async resetWithKnownEmail(email: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return;
    const passwordHash = await this.passwordService.hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
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
