#!/bin/bash

# Скрипт для запуска Redis для Online Orders Backend

echo "🚀 Запуск Redis для Online Orders Backend..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker для продолжения."
    exit 1
fi

# Проверяем, запущен ли Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен. Запустите Docker для продолжения."
    exit 1
fi

# Останавливаем существующие контейнеры Redis
echo "🛑 Остановка существующих контейнеров Redis..."
docker-compose -f docker-compose.redis.yml down

# Запускаем Redis
echo "✅ Запуск Redis..."
docker-compose -f docker-compose.redis.yml up -d

# Ждем запуска Redis
echo "⏳ Ожидание запуска Redis..."
sleep 5

# Проверяем статус
if docker-compose -f docker-compose.redis.yml ps | grep -q "Up"; then
    echo "✅ Redis успешно запущен!"
    echo "📍 Redis доступен по адресу: localhost:6379"
    echo "🌐 Redis Commander доступен по адресу: http://localhost:8081"
    echo ""
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.redis.yml ps
else
    echo "❌ Ошибка запуска Redis. Проверьте логи:"
    docker-compose -f docker-compose.redis.yml logs
    exit 1
fi


