import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { RegisterDto } from '../dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createUser(input: RegisterDto) {
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
    });

    return user;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        avatar: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true,
      },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        avatar: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async validateUserCredentials(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const isValid = await this.passwordService.verifyPassword(
      password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    return user;
  }
}
