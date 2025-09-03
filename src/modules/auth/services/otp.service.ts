import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../../common/cache/redis.service';
import { MailerService } from '../../../common/mailer/mailer.service';
import { randomBytes } from 'node:crypto';

@Injectable()
export class OtpService {
  private readonly registerTtlSec = 10 * 60;
  private readonly maxAttempts = 5;

  constructor(
    private readonly redis: RedisService,
    private readonly mailer: MailerService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private key(email: string) {
    return this.redis.generateKey('otp:register', email);
  }
  private attemptsKey(email: string) {
    return this.redis.generateKey('otp:register:attempts', email);
  }

  async sendRegisterCode(email: string): Promise<void> {
    const code = this.generateCode();
    await this.redis.set(this.key(email), code, 'auth');
    await this.mailer.sendOtpCode(email, code, 'register');
  }

  async verifyRegisterCode(email: string, inputCode: string): Promise<void> {
    const attemptsKey = this.attemptsKey(email);
    const codeKey = this.key(email);

    // попытки
    const current = await this.redis.get<number>(attemptsKey);
    const count = (current ?? 0) + 1;
    if (count > this.maxAttempts) {
      throw new BadRequestException(
        'Превышено число попыток, запросите код заново',
      );
    }
    await this.redis.set(attemptsKey, count, 'auth');

    // проверка кода
    const stored = await this.redis.get<string>(codeKey);
    if (!stored) throw new BadRequestException('Код истёк или не найден');
    if (stored !== inputCode) throw new BadRequestException('Неверный код');

    // успех → очистка
    await this.redis.del(codeKey);
    await this.redis.del(attemptsKey);
  }

  private resetKey(email: string) {
    return this.redis.generateKey('otp:reset', email);
  }
  private resetAttemptsKey(email: string) {
    return this.redis.generateKey('otp:reset:attempts', email);
  }
  private resetTokenKey(token: string) {
    return this.redis.generateKey('reset:token', token);
  }

  async sendResetCode(email: string): Promise<void> {
    const code = this.generateCode();
    await this.redis.set(this.resetKey(email), code, 'auth');
    await this.mailer.sendOtpCode(email, code, 'reset');
  }

  async verifyResetCode(email: string, inputCode: string): Promise<string> {
    const attemptsKey = this.resetAttemptsKey(email);
    const codeKey = this.resetKey(email);

    const current = await this.redis.get<number>(attemptsKey);
    const count = (current ?? 0) + 1;
    if (count > this.maxAttempts) {
      throw new BadRequestException(
        'Превышено число попыток, запросите код заново',
      );
    }
    await this.redis.set(attemptsKey, count, 'auth');

    const stored = await this.redis.get<string>(codeKey);
    if (!stored) throw new BadRequestException('Код истёк или не найден');
    if (stored !== inputCode) throw new BadRequestException('Неверный код');

    // успех → выдаём короткий resetToken
    const token = randomBytes(16).toString('hex');
    await this.redis.set(this.resetTokenKey(token), { email }, 'auth');

    await this.redis.del(codeKey);
    await this.redis.del(attemptsKey);
    return token;
  }

  async consumeResetToken(token: string): Promise<string> {
    const key = this.resetTokenKey(token);
    const data = await this.redis.get<{ email: string }>(key);
    if (!data)
      throw new BadRequestException('Недействительный или истекший токен');
    await this.redis.del(key);
    return data.email;
  }
}
