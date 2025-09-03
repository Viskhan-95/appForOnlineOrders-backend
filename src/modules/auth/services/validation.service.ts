import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
  private readonly PASSWORD_MIN_LENGTH = 6;
  private readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

  validatePassword(password: string): void {
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Пароль должен содержать минимум ${this.PASSWORD_MIN_LENGTH} символов`,
      );
    }

    if (!this.PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Пароль должен содержать: строчные и заглавные буквы, цифры и специальные символы',
      );
    }
  }

  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Некорректный формат email');
    }
  }

  validatePhone(phone: string): void {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Некорректный формат номера телефона');
    }
  }

  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Убираем потенциально опасные символы
      .substring(0, 255); // Ограничиваем длину
  }

  validateName(name: string): void {
    if (name.length < 2) {
      throw new BadRequestException('Имя должно содержать минимум 2 символа');
    }

    if (name.length > 50) {
      throw new BadRequestException('Имя не должно превышать 50 символов');
    }

    // Проверяем на наличие только букв, пробелов и дефисов
    const nameRegex = /^[а-яёa-z\s-]+$/i;
    if (!nameRegex.test(name)) {
      throw new BadRequestException('Имя содержит недопустимые символы');
    }
  }
}
