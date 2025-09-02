import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms, { type StringValue } from 'ms';
import { randomBytes } from 'node:crypto';

export type JwtPayload = { sub: string; email: string };

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signTokens(args: { userId: string; email: string }) {
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

  getRefreshExpiresAt(): Date {
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

  getResetExpiresAt(): Date {
    const raw = this.config.get<string>('PASSWORD_RESET_EXPIRES') ?? '30m';
    const ttlMs = ms(raw as StringValue);
    if (typeof ttlMs !== 'number')
      throw new Error('Invalid PASSWORD_RESET_EXPIRES');
    return new Date(Date.now() + ttlMs);
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex'); // 64 hex chars
  }

  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    const payload: JwtPayload = await this.jwt.verifyAsync(refreshToken, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', ''),
    });
    return payload;
  }
}
