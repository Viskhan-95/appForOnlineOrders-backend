import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRefreshToken(args: {
    userId: string;
    refreshToken: string;
    userAgent?: string | null;
    ip?: string | null;
    expiresAt: Date;
  }): Promise<void> {
    const hashed = await bcrypt.hash(args.refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: args.userId,
        hashed,
        userAgent: args.userAgent ?? null,
        ip: args.ip ?? null,
        expiresAt: args.expiresAt,
      },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findMatchingRefreshToken(userId: string, rawToken: string) {
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

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  }
}
