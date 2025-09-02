import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';

export interface SessionMeta {
  ua?: string | null;
  ip?: string | null;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async createSession(userId: string, email: string, meta?: SessionMeta) {
    const tokens = await this.tokenService.signTokens({ userId, email });

    await this.refreshTokenService.saveRefreshToken({
      userId,
      refreshToken: tokens.refreshToken,
      userAgent: meta?.ua ?? null,
      ip: meta?.ip ?? null,
      expiresAt: this.tokenService.getRefreshExpiresAt(),
    });

    return tokens;
  }

  async refreshSession(refreshToken: string, meta?: SessionMeta) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      const match = await this.refreshTokenService.findMatchingRefreshToken(
        payload.sub,
        refreshToken,
      );

      if (!match) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Отзываем старый токен
      await this.refreshTokenService.revokeRefreshToken(match.id);

      // Создаем новую сессию
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

      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async terminateSession(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  async terminateSpecificSession(tokenId: string): Promise<void> {
    await this.refreshTokenService.revokeRefreshToken(tokenId);
  }
}
