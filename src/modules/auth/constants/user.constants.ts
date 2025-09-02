export const USER_SELECT_FIELDS = {
  basic: {
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
  withPassword: {
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
  minimal: {
    id: true,
    email: true,
    name: true,
  },
} as const;

export const USER_ROLES = ['SUPERADMIN', 'ADMIN', 'USER'] as const;
export type UserRole = (typeof USER_ROLES)[number];
