# 🚀 Online Orders Backend API

## 📋 Описание

Backend API для приложения онлайн-заказов, построенный на NestJS с использованием PostgreSQL и Prisma ORM.

## 🏗️ Архитектура

### **Структура проекта:**

```
src/
├── common/                 # Общие компоненты
│   ├── dto/               # Data Transfer Objects
│   ├── exceptions/        # Кастомные исключения
│   ├── filters/          # Глобальные фильтры
│   ├── interceptors/     # Перехватчики
│   ├── middleware/       # Middleware
│   ├── pipes/            # Валидационные пайпы
│   ├── services/         # Общие сервисы
│   └── interfaces/       # Общие интерфейсы
├── config/               # Конфигурация
├── modules/              # Модули приложения
│   ├── auth/            # Аутентификация
│   ├── health/          # Проверка здоровья
│   └── users/           # Управление пользователями
└── prisma/              # Prisma ORM
```

### **Основные принципы:**

- ✅ **Single Responsibility Principle** - каждый сервис отвечает за одну задачу
- ✅ **Dependency Injection** - использование NestJS DI контейнера
- ✅ **Separation of Concerns** - разделение логики по модулям
- ✅ **Type Safety** - строгая типизация TypeScript
- ✅ **Error Handling** - централизованная обработка ошибок

## 🔐 Аутентификация

### **JWT Strategy:**

- Access Token (15 минут)
- Refresh Token (7 дней)
- Автоматическая ротация токенов

### **Безопасность:**

- Rate limiting для критических эндпоинтов
- Валидация и санитизация входных данных
- Хеширование паролей с bcrypt
- Защита от SQL инъекций (Prisma)

## 📊 API Endpoints

### **Аутентификация:**

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Информация о пользователе
- `POST /api/auth/request-reset` - Запрос сброса пароля
- `POST /api/auth/reset-confirm` - Подтверждение сброса

### **Здоровье системы:**

- `GET /api/health` - Проверка здоровья
- `GET /api/health/db` - Проверка базы данных

## 🛠️ Технологии

- **Framework:** NestJS 10
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5
- **HTTP Server:** Fastify
- **Validation:** class-validator + class-transformer
- **Authentication:** Passport.js + JWT
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

## 🚀 Запуск

### **Установка зависимостей:**

```bash
npm install
```

### **Настройка окружения:**

```bash
cp .env.example .env
# Заполните необходимые переменные
```

### **Запуск базы данных:**

```bash
docker compose up -d
```

### **Миграции:**

```bash
npx prisma migrate dev
```

### **Запуск в режиме разработки:**

```bash
npm run start:dev
```

### **Сборка для продакшена:**

```bash
npm run build
npm run start:prod
```

## 📝 Переменные окружения

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Приложение
PORT=3000
NODE_ENV="development"
APP_URL="http://localhost:3000"
```

## 🧪 Тестирование

### **Unit тесты:**

```bash
npm run test
```

### **E2E тесты:**

```bash
npm run test:e2e
```

### **Coverage:**

```bash
npm run test:cov
```

## 📚 Документация API

После запуска приложения документация доступна по адресу:

- **Swagger UI:** `http://localhost:3000/docs`
- **OpenAPI JSON:** `http://localhost:3000/docs-json`

## 🔍 Мониторинг

### **Логирование:**

- Структурированные логи с метаданными
- Автоматическое логирование всех запросов
- Логирование ошибок с контекстом

### **Метрики:**

- Время выполнения запросов
- Статус коды ответов
- Информация о пользователях

## 🚨 Безопасность

- **Helmet.js** - защита заголовков
- **CORS** - настройка cross-origin запросов
- **Rate Limiting** - защита от DDoS
- **Input Validation** - валидация всех входных данных
- **SQL Injection Protection** - Prisma ORM
- **XSS Protection** - санитизация данных

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.
