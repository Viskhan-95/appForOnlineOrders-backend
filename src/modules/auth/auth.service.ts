import { Injectable } from '@nestjs/common';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';
import { PasswordResetService } from './services/password-reset.service';
import type { SessionMeta } from './services/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly validationService: ValidationService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(input: RegisterDto) {
    // Валидируем входные данные
    this.validationService.validateEmail(input.email);
    this.validationService.validatePassword(input.password);
    this.validationService.validateName(input.name);
    this.validationService.validatePhone(input.phone);

    // Санитизируем входные данные
    const sanitizedInput = {
      ...input,
      email: this.validationService.sanitizeInput(input.email),
      name: this.validationService.sanitizeInput(input.name),
      phone: this.validationService.sanitizeInput(input.phone),
      address: input.address
        ? this.validationService.sanitizeInput(input.address)
        : undefined,
    };

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
    this.validationService.validateEmail(input.email);
    this.validationService.validatePassword(input.password);

    // Проверяем учетные данные
    const user = await this.userService.validateUserCredentials(
      input.email,
      input.password,
    );

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

  async requestReset(email: string): Promise<void> {
    this.validationService.validateEmail(email);
    await this.passwordResetService.requestReset(email);
  }

  async resetConfirm(token: string, newPassword: string): Promise<void> {
    this.validationService.validatePassword(newPassword);
    await this.passwordResetService.resetConfirm(token, newPassword);
  }
}
