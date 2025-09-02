import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  RegisterSchema,
  LoginSchema,
  RequestResetSchema,
  ResetConfirmSchema,
} from './auth.zod';
import type {
  RegisterInput,
  LoginInput,
  RequestResetInput,
  ResetConfirmInput,
} from './auth.zod';
import { AuthService } from './auth.service';
import { RefreshTokenSchema } from './auth.zod';
import type { RefreshTokenInput } from './auth.zod';
import { UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Throttle } from '@nestjs/throttler';
import { Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //POST /auth/register -> 201
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput,
  ) {
    return this.authService.register(body);
  }

  //POST /auth/login -> 200
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Req() req: FastifyRequest,
  ) {
    const ua = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;
    return this.authService.login(body, { ua, ip });
  }

  //POST /auth/refresh -> 200
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenInput,
    @Req() req: FastifyRequest,
  ) {
    const ua = (req.headers['user-agent'] as string) ?? null;
    const ip = req.ip ?? null;
    return this.authService.refresh(body.refreshToken, { ua, ip });
  }

  //GET /auth/me -> 200
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  //POST /auth/logout -> 200
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  @Post('logout')
  async logout(@CurrentUser() user: { userId: string; email: string }) {
    await this.authService.logout(user.userId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(200)
  @Post('request-reset')
  async requestReset(
    @Body(new ZodValidationPipe(RequestResetSchema)) body: RequestResetInput,
  ) {
    await this.authService.requestReset(body.email);
    return { ok: true };
  }

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(200)
  @Post('reset-confirm')
  async resetConfirm(
    @Body(new ZodValidationPipe(ResetConfirmSchema)) body: ResetConfirmInput,
  ) {
    await this.authService.resetConfirm(body.token, body.newPassword);
    return { ok: true };
  }
}
