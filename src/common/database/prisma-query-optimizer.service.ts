import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaQueryOptimizerService {
  private readonly logger = new Logger(PrismaQueryOptimizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Оптимизированный запрос пользователей с пагинацией
   */
  async getUsersWithPagination(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
  ) {
    const skip = (page - 1) * limit;

    // Базовый where для фильтрации
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Параллельные запросы для оптимизации
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Оптимизированный запрос пользователя с связанными данными
   */
  async getUserWithRelations(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        address: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        // Связанные данные
        refreshTokens: {
          select: {
            id: true,
            userAgent: true,
            ip: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Ограничиваем количество токенов
        },
        // Можно добавить другие связанные модели
      },
    });
  }

  /**
   * Batch операции для массового обновления
   */
  async batchUpdateUsers(updates: Array<{ id: string; data: any }>) {
    const transactions = updates.map(({ id, data }) =>
      this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true },
      }),
    );

    return this.prisma.$transaction(transactions);
  }

  /**
   * Оптимизированный поиск по нескольким критериям
   */
  async findUsersByMultipleCriteria(criteria: {
    emails?: string[];
    roles?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
  }) {
    const where: any = {};

    if (criteria.emails && criteria.emails.length > 0) {
      where.email = { in: criteria.emails };
    }

    if (criteria.roles && criteria.roles.length > 0) {
      where.role = { in: criteria.roles };
    }

    if (criteria.createdAfter || criteria.createdBefore) {
      where.createdAt = {};
      if (criteria.createdAfter) {
        where.createdAt.gte = criteria.createdAfter;
      }
      if (criteria.createdBefore) {
        where.createdAt.lte = criteria.createdBefore;
      }
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получение статистики пользователей
   */
  async getUserStatistics() {
    const [totalUsers, usersByRole, recentUsers, activeUsers] =
      await Promise.all([
        // Общее количество пользователей
        this.prisma.user.count(),

        // Пользователи по ролям
        this.prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),

        // Недавно зарегистрированные пользователи
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Последние 7 дней
            },
          },
        }),

        // Активные пользователи (с токенами)
        this.prisma.user.count({
          where: {
            refreshTokens: {
              some: {
                expiresAt: { gt: new Date() },
              },
            },
          },
        }),
      ]);

    return {
      total: totalUsers,
      byRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recent: recentUsers,
      active: activeUsers,
    };
  }

  /**
   * Очистка устаревших данных
   */
  async cleanupExpiredData() {
    const now = new Date();

    // Удаляем истекшие refresh токены
    const deletedTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    // Можно добавить очистку других устаревших данных

    this.logger.log(`Cleaned up ${deletedTokens.count} expired refresh tokens`);

    return {
      deletedTokens: deletedTokens.count,
    };
  }
}
