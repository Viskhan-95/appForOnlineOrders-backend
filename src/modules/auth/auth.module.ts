import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MailerModule } from '../../common/mailer/mailer.module';

// Основные сервисы
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { PasswordResetService } from './services/password-reset.service';
import { OtpService } from './services/otp.service';

// Новые сервисы
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';
import { BaseValidationService } from './services/base-validation.service';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    MailerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenService,
    PasswordService,
    RefreshTokenService,
    PasswordResetService,
    OtpService,
    UserService,
    SessionService,
    ValidationService,
    BaseValidationService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
