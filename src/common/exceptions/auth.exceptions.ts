import { HttpException, HttpStatus } from '@nestjs/common';

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        message: 'Пользователь с таким email уже существует',
        error: 'USER_ALREADY_EXISTS',
        email,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        message: 'Неверные учетные данные',
        error: 'INVALID_CREDENTIALS',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidRefreshTokenException extends HttpException {
  constructor() {
    super(
      {
        message: 'Недействительный refresh токен',
        error: 'INVALID_REFRESH_TOKEN',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class PasswordResetTokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        message: 'Токен для сброса пароля истек',
        error: 'PASSWORD_RESET_TOKEN_EXPIRED',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        message: 'Пользователь не найден',
        error: 'USER_NOT_FOUND',
        identifier,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
