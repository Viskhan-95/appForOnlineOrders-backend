import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Password Reset
  PASSWORD_RESET_EXPIRES: z.string().default('30m'),

  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform(Number)
    .pipe(z.number().min(1).max(65535)),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform(Number)
    .pipe(z.number().min(1).max(65535)),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z
    .string()
    .default('0')
    .transform(Number)
    .pipe(z.number().min(0).max(15)),
  REDIS_KEY_PREFIX: z.string().default('online_orders:'),
  REDIS_TTL_USER: z
    .string()
    .default('3600')
    .transform(Number)
    .pipe(z.number().min(60)),
  REDIS_TTL_SESSION: z
    .string()
    .default('1800')
    .transform(Number)
    .pipe(z.number().min(60)),
  REDIS_TTL_AUTH: z
    .string()
    .default('300')
    .transform(Number)
    .pipe(z.number().min(60)),
  REDIS_TTL_GENERAL: z
    .string()
    .default('600')
    .transform(Number)
    .pipe(z.number().min(60)),

  // App
  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().min(1).max(65535)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;
