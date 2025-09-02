import { Injectable, Logger } from '@nestjs/common';

interface RateLimitConfig {
  ttl: number;
  limit: number;
  key?: string;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  private readonly defaultConfigs: Record<string, RateLimitConfig> = {
    auth: { ttl: 60_000, limit: 5 }, // 5 попыток в минуту для аутентификации
    passwordReset: { ttl: 60_000, limit: 3 }, // 3 попытки в минуту для сброса пароля
    general: { ttl: 60_000, limit: 100 }, // 100 запросов в минуту для общих эндпоинтов
  };

  checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
    const key = `${identifier}:${config.key || 'default'}`;
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Создаем новую запись
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + config.ttl,
      });
      return true;
    }

    if (record.count >= config.limit) {
      this.logger.warn(`Rate limit exceeded for ${identifier}`);
      return false;
    }

    // Увеличиваем счетчик
    record.count++;
    return true;
  }

  getConfigForEndpoint(endpoint: string): RateLimitConfig {
    if (endpoint.includes('auth')) {
      return this.defaultConfigs.auth;
    }
    if (endpoint.includes('password-reset') || endpoint.includes('reset')) {
      return this.defaultConfigs.passwordReset;
    }
    return this.defaultConfigs.general;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
