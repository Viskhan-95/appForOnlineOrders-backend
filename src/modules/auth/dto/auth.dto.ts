import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ description: 'Пароль пользователя', minLength: 8 })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Пароль должен содержать: строчные и заглавные буквы, цифры и специальные символы',
  })
  password: string;

  @ApiProperty({ description: 'Имя пользователя', minLength: 2, maxLength: 50 })
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя не должно превышать 50 символов' })
  @Matches(/^[а-яёa-z\s-]+$/i, { message: 'Имя содержит недопустимые символы' })
  name: string;

  @ApiProperty({ description: 'Номер телефона' })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Некорректный формат номера телефона',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Роль пользователя',
    enum: ['SUPERADMIN', 'ADMIN', 'USER'],
  })
  @IsOptional()
  @IsEnum(['SUPERADMIN', 'ADMIN', 'USER'], { message: 'Некорректная роль' })
  role?: 'SUPERADMIN' | 'ADMIN' | 'USER';

  @ApiPropertyOptional({ description: 'Адрес пользователя' })
  @IsOptional()
  @IsString({ message: 'Адрес должен быть строкой' })
  @MaxLength(255, { message: 'Адрес не должен превышать 255 символов' })
  address?: string;

  @ApiPropertyOptional({ description: 'URL аватара' })
  @IsOptional()
  @IsString({ message: 'URL аватара должен быть строкой' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'ID ресторана' })
  @IsOptional()
  @IsString({ message: 'ID ресторана должен быть строкой' })
  restaurantId?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;

  @ApiProperty({ description: 'Пароль пользователя' })
  @IsString({ message: 'Пароль должен быть строкой' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh токен' })
  @IsString({ message: 'Refresh токен должен быть строкой' })
  refreshToken: string;
}

export class RequestResetDto {
  @ApiProperty({ description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Токен для сброса пароля' })
  @IsString({ message: 'Токен должен быть строкой' })
  token: string;

  @ApiProperty({ description: 'Новый пароль', minLength: 8 })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Пароль должен содержать: строчные и заглавные буквы, цифры и специальные символы',
  })
  newPassword: string;
}
