import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { RedisService } from '../../../common/cache/redis.service';
import { PasswordService } from './password.service';
import type {
  UserData,
  UserWithPassword,
  CreateUserData,
  UserCredentials,
} from '../interfaces/user.interfaces';

@Injectable()
export class CachedUserService {
  private readonly logger = new Logger(CachedUserService.name);

  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Создание пользователя с инвалидацией кэша
   */
  async createUser(input: CreateUserData): Promise<UserData> {
    const user = await this.userService.createUser(input);

    // Инвалидируем кэш для email
    await this.redisService.del(
      this.redisService.generateKey('user:email', input.email),
    );

    // Кэшируем нового пользователя
    await this.redisService.set(
      this.redisService.generateKey('user:id', user.id),
      user,
      'user',
    );

    this.logger.debug(`User created and cached: ${user.id}`);
    return user;
  }

  /**
   * Поиск пользователя по email с кэшированием
   */
  async findUserByEmail(email: string): Promise<UserWithPassword | null> {
    const cacheKey = this.redisService.generateKey('user:email', email);

    // Пытаемся получить из кэша
    const cachedUser = await this.redisService.get<UserWithPassword>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`User found in cache by email: ${email}`);
      return cachedUser;
    }

    // Если нет в кэше, получаем из БД
    const user = await this.userService.findUserByEmail(email);
    if (user) {
      const { passwordHash: _passwordHash, ...safeUser } = user;
      await this.redisService.set(
        cacheKey,
        safeUser as unknown as UserWithPassword,
        'user',
      );
      await this.redisService.set(
        this.redisService.generateKey('user:id', user.id),
        safeUser,
        'user',
      );
      this.logger.debug(`User cached by email: ${email}`);
    }

    return user;
  }

  /**
   * Поиск пользователя по ID с кэшированием
   */
  async findUserById(id: string): Promise<UserData | null> {
    const cacheKey = this.redisService.generateKey('user:id', id);

    // Пытаемся получить из кэша
    const cachedUser = await this.redisService.get<UserData>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`User found in cache by ID: ${id}`);
      return cachedUser;
    }

    // Если нет в кэше, получаем из БД
    const user = await this.userService.findUserById(id);
    if (user) {
      // Кэшируем результат
      await this.redisService.set(cacheKey, user, 'user');
      await this.redisService.set(
        this.redisService.generateKey('user:email', user.email),
        user,
        'user',
      );
      this.logger.debug(`User cached by ID: ${id}`);
    }

    return user;
  }

  /**
   * Валидация учетных данных с кэшированием
   */
  async validateUserCredentials(
    credentials: UserCredentials,
  ): Promise<UserData> {
    const user = await this.findUserByEmail(credentials.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Валидация пароля
    const isValid = await this.passwordService.verifyPassword(
      credentials.password,
      user.passwordHash,
    );

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Возвращаем безопасную версию пользователя
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Инвалидация кэша пользователя
   */
  async invalidateUserCache(userId: string, email?: string): Promise<void> {
    const keysToDelete = [this.redisService.generateKey('user:id', userId)];

    if (email) {
      keysToDelete.push(this.redisService.generateKey('user:email', email));
    }

    await Promise.all(keysToDelete.map((key) => this.redisService.del(key)));
    this.logger.debug(`User cache invalidated for ID: ${userId}`);
  }

  /**
   * Обновление кэша пользователя
   */
  async updateUserCache(user: UserData): Promise<void> {
    const keys = [
      this.redisService.generateKey('user:id', user.id),
      this.redisService.generateKey('user:email', user.email),
    ];

    await Promise.all(
      keys.map((key) => this.redisService.set(key, user, 'user')),
    );
    this.logger.debug(`User cache updated for ID: ${user.id}`);
  }
}
