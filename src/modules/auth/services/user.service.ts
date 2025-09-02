import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { USER_SELECT_FIELDS } from '../constants/user.constants';
import type {
  CreateUserData,
  UserData,
  UserWithPassword,
  UserCredentials,
} from '../interfaces/user.interfaces';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createUser(input: CreateUserData): Promise<UserData> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Электронная почта уже используется');
    }

    const passwordHash = await this.passwordService.hashPassword(
      input.password,
    );

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        phone: input.phone,
        role: input.role ?? 'USER',
        address: input.address ?? null,
        avatar: input.avatar ?? null,
        restaurantId: input.restaurantId ?? null,
      },
      select: USER_SELECT_FIELDS.basic,
    });

    return user;
  }

  async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_SELECT_FIELDS.withPassword,
    });
  }

  async findUserById(id: string): Promise<UserData | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT_FIELDS.basic,
    });
  }

  async validateUserCredentials(
    credentials: UserCredentials,
  ): Promise<UserData> {
    const user = await this.findUserByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const isValid = await this.passwordService.verifyPassword(
      credentials.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
