import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'online_orders:',
  ttl: {
    user: parseInt(process.env.REDIS_TTL_USER, 10) || 3600, // 1 час
    session: parseInt(process.env.REDIS_TTL_SESSION, 10) || 1800, // 30 минут
    auth: parseInt(process.env.REDIS_TTL_AUTH, 10) || 300, // 5 минут
    general: parseInt(process.env.REDIS_TTL_GENERAL, 10) || 600, // 10 минут
  },
}));
