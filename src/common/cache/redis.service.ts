import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly keyPrefix: string;
  private readonly ttl: Record<string, number>;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.keyPrefix = this.configService.get(
      'redis.keyPrefix',
      'online_orders:',
    );
    this.ttl = this.configService.get('redis.ttl', {
      user: 3600,
      session: 1800,
      auth: 300,
      general: 600,
    });
  }

  /**
   * Получить значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const value = await this.cacheManager.get<T>(fullKey);

      if (value !== undefined) {
        this.logger.debug(`Cache hit: ${fullKey}`);
        return value;
      }

      this.logger.debug(`Cache miss: ${fullKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Установить значение в кэш
   */
  async set(key: string, value: unknown, ttl?: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const cacheTtl = ttl
        ? this.ttl[ttl] || this.ttl.general
        : this.ttl.general;

      await this.cacheManager.set(fullKey, value, cacheTtl);
      this.logger.debug(`Cache set: ${fullKey} (TTL: ${cacheTtl}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Удалить значение из кэша
   */
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.cacheManager.del(fullKey);
      this.logger.debug(`Cache deleted: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Очистить весь кэш
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache reset completed');
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
    }
  }

  /**
   * Получить статистику кэша
   */
  async getStats(): Promise<Record<string, unknown>> {
    try {
      const store = this.cacheManager.store;
      if (store && typeof store.getStats === 'function') {
        return store.getStats();
      }
      return { message: 'Stats not available for this cache store' };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { error: 'Failed to get cache stats' };
    }
  }

  /**
   * Построить полный ключ с префиксом
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Генерация ключей для разных типов данных
   */
  generateKey(type: string, identifier: string): string {
    return `${type}:${identifier}`;
  }

  /**
   * Получить TTL для конкретного типа
   */
  getTtl(type: string): number {
    return this.ttl[type] || this.ttl.general;
  }
}
