import { Injectable } from '@nestjs/common';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { BaseValidationService } from './services/base-validation.service';
import { PasswordResetService } from './services/password-reset.service';
import type { SessionMeta } from './services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly baseValidationService: BaseValidationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(input: RegisterDto) {
    // Валидируем и санитизируем входные данные
    this.baseValidationService.validateUserRegistration(input);
    const sanitizedInput = this.baseValidationService.sanitizeUserInput(input);

    // Создаем пользователя
    const user = await this.userService.createUser({
      ...sanitizedInput,
      role: sanitizedInput.role || 'USER',
    });

    // Создаем сессию
    const tokens = await this.sessionService.createSession(user.id, user.email);

    return {
      user: await this.userService.findUserById(user.id),
      ...tokens,
    };
  }

  async login(input: LoginDto, meta?: SessionMeta) {
    // Валидируем входные данные
    this.baseValidationService.validateUserLogin(input);

    // Проверяем учетные данные
    const user = await this.userService.validateUserCredentials(input);

    // Создаем сессию
    const tokens = await this.sessionService.createSession(
      user.id,
      user.email,
      meta,
    );

    return {
      user: await this.userService.findUserById(user.id),
      ...tokens,
    };
  }

  async refresh(refreshToken: string, meta?: SessionMeta) {
    return this.sessionService.refreshSession(refreshToken, meta);
  }

  async logout(userId: string): Promise<void> {
    await this.sessionService.terminateSession(userId);
  }

  async me(userId: string) {
    return this.userService.findUserById(userId);
  }

  async resetConfirmTokenKnownEmail(
    email: string,
    newPassword: string,
  ): Promise<void> {
    this.baseValidationService.validatePassword(newPassword);
    await this.passwordResetService.resetWithKnownEmail(email, newPassword);
  }
}
