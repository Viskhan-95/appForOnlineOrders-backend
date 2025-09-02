#!/bin/bash

# Скрипт для остановки Redis для Online Orders Backend

echo "🛑 Остановка Redis для Online Orders Backend..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен."
    exit 1
fi

# Останавливаем Redis
echo "✅ Остановка Redis..."
docker-compose -f docker-compose.redis.yml down

echo "✅ Redis остановлен!"
echo "💾 Данные Redis сохранены в volume redis_data"
echo ""
echo "Для полного удаления данных выполните:"
echo "docker-compose -f docker-compose.redis.yml down -v"
