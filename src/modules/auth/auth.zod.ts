import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
  phone: z.string().min(10).max(15),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'USER']),
  address: z.string().min(3).optional().nullable(),
  avatar: z.string().optional().nullable(),
  restaurantId: z.string().optional().nullable(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const RequestResetSchema = z.object({
  email: z.string().email(),
});
export type RequestResetInput = z.infer<typeof RequestResetSchema>;

export const ResetConfirmSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(6),
});
export type ResetConfirmInput = z.infer<typeof ResetConfirmSchema>;
