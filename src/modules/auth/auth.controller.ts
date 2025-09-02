import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RequestResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import type { FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: LoginDto, @Req() req: FastifyRequest) {
    const ua = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;
    return this.authService.login(body, { ua, ip });
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async refresh(@Body() body: RefreshTokenDto, @Req() req: FastifyRequest) {
    const ua = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;
    return this.authService.refresh(body.refreshToken, { ua, ip });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@CurrentUser() user: { userId: string; email: string }) {
    return this.authService.me(user.userId);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  async logout(@CurrentUser() user: { userId: string; email: string }) {
    await this.authService.logout(user.userId);
  }

  @Post('request-reset')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async requestReset(@Body() body: RequestResetDto) {
    await this.authService.requestReset(body.email);
    return {
      message: 'Если email существует, отправлено письмо для сброса пароля',
    };
  }

  @Post('reset-confirm')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async resetConfirm(@Body() body: ResetPasswordDto) {
    await this.authService.resetConfirm(body.token, body.newPassword);
    return { message: 'Пароль успешно изменен' };
  }
}
