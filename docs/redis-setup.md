# 🚀 Redis Setup для Online Orders Backend

## 📋 Описание

Redis используется для кэширования данных и повышения производительности приложения.

## 🛠️ Установка и запуск

### **Автоматический запуск:**

```bash
# Запуск Redis
./scripts/start-redis.sh

# Остановка Redis
./scripts/stop-redis.sh
```

### **Ручной запуск:**

```bash
# Запуск Redis
docker-compose -f docker-compose.redis.yml up -d

# Остановка Redis
docker-compose -f docker-compose.redis.yml down

# Просмотр логов
docker-compose -f docker-compose.redis.yml logs -f
```

## 🌐 Доступ к сервисам

- **Redis Server:** `localhost:6379`
- **Redis Commander (Web UI):** `http://localhost:8081`

## ⚙️ Конфигурация

### **Переменные окружения:**

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=online_orders:
REDIS_TTL_USER=3600
REDIS_TTL_SESSION=1800
REDIS_TTL_AUTH=300
REDIS_TTL_GENERAL=600
```

### **TTL (Time To Live):**

- **User:** 1 час (3600 секунд)
- **Session:** 30 минут (1800 секунд)
- **Auth:** 5 минут (300 секунд)
- **General:** 10 минут (600 секунд)

## 📊 Мониторинг

### **Redis Commander:**

- Веб-интерфейс для управления Redis
- Просмотр ключей и значений
- Мониторинг производительности

### **Redis CLI:**

```bash
# Подключение к Redis
docker exec -it online_orders_redis redis-cli

# Основные команды
INFO                    # Информация о сервере
MONITOR                # Мониторинг команд
SLOWLOG GET 10         # Медленные запросы
MEMORY USAGE           # Использование памяти
```

## 🔧 Оптимизация

### **Настройки памяти:**

- **maxmemory:** 256MB
- **maxmemory-policy:** allkeys-lru (удаление по LRU)

### **Персистентность:**

- **RDB:** Снапшоты каждые 900/300/60 секунд
- **AOF:** Логирование каждой команды

## 🚨 Безопасность

### **Сетевая безопасность:**

- Redis доступен только локально
- Порт 6379 не открыт наружу

### **Аутентификация:**

- Для продакшена раскомментируйте `requirepass` в `redis.conf`
- Установите сложный пароль

## 📈 Производительность

### **Кэширование:**

- Пользователи кэшируются на 1 час
- Сессии кэшируются на 30 минут
- Аутентификация кэшируется на 5 минут

### **Метрики:**

- Latency monitoring включен
- Slow log для запросов > 10ms
- Health checks каждые 30 секунд

## 🐛 Troubleshooting

### **Проблемы с подключением:**

```bash
# Проверка статуса контейнера
docker-compose -f docker-compose.redis.yml ps

# Просмотр логов
docker-compose -f docker-compose.redis.yml logs redis

# Проверка подключения
docker exec -it online_orders_redis redis-cli ping
```

### **Проблемы с памятью:**

```bash
# Очистка кэша
docker exec -it online_orders_redis redis-cli FLUSHALL

# Информация о памяти
docker exec -it online_orders_redis redis-cli INFO memory
```

## 📚 Полезные ссылки

- [Redis Documentation](https://redis.io/documentation)
- [Redis Commander](https://github.com/joeferner/redis-commander)
- [Redis Best Practices](https://redis.io/topics/optimization)

