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
import { OtpService } from './services/otp.service';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RegisterStartDto,
  RegisterVerifyDto,
  ResetStartOtpDto,
  ResetVerifyOtpDto,
  ResetConfirmWithTokenDto,
} from './dto/auth.dto';
import type { FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register-start')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async registerStart(@Body() body: RegisterStartDto) {
    await this.otpService.sendRegisterCode(body.email);
    return { message: 'Код отправлен на email' };
  }

  @Post('register-verify')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async registerVerify(
    @Body() body: RegisterVerifyDto,
    @Req() req: FastifyRequest,
  ) {
    await this.otpService.verifyRegisterCode(body.email, body.code);
    // после успешной верификации создаём пользователя
    const ua = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;
    const user = await this.userService.createUser({
      email: body.email,
      name: body.name,
      password: body.password,
      phone: body.phone,
      address: body.address,
      avatar: body.avatar,
      role: body.role ?? 'USER',
    });

    const tokens = await this.sessionService.createSession(
      user.id,
      user.email,
      { ua, ip },
    );
    return { user, ...tokens };
  }

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
  async requestReset(@Body() body: ResetStartOtpDto) {
    await this.otpService.sendResetCode(body.email);
    return {
      message: 'Если email существует, отправлен код для восстановления',
    };
  }

  @Post('reset-verify')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async resetVerify(@Body() body: ResetVerifyOtpDto) {
    const resetToken = await this.otpService.verifyResetCode(
      body.email,
      body.code,
    );
    return { resetToken };
  }

  @Post('reset-confirm')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async resetConfirm(@Body() body: ResetConfirmWithTokenDto) {
    const { resetToken, newPassword } = body;
    const email = await this.otpService.consumeResetToken(resetToken);

    await this.authService.resetConfirmTokenKnownEmail(email, newPassword);
    return { message: 'Пароль успешно изменен' };
  }
}
