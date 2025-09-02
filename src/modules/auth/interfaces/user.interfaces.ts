import type { UserRole } from '../constants/user.constants';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  phone: string;
  role?: UserRole;
  address?: string;
  avatar?: string;
  restaurantId?: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  address?: string | null;
  avatar?: string | null;
  restaurantId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends UserData {
  passwordHash: string;
}

export type SafeUserData = Omit<UserData, never>;

export interface UserCredentials {
  email: string;
  password: string;
}
