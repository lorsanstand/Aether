<div align="center">

# 🌌 Aether

<img src="assets/mini-logo.png" alt="Aether logo" width="150" style="border-radius: 15px;">

**Современная full-stack платформа для чатов с мощным backend и элегантным frontend**

[![Python](https://img.shields.io/badge/Python-3.13%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.124%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)](LICENSE)

[Особенности](#-особенности) • [Технологии](#️-технологии) • [Установка](#-быстрый-старт) • [Документация](#-документация) • [Разработка](#-разработка)

</div>

---

## ✨ Особенности

- 🚀 **Высокая производительность**: Асинхронный backend на FastAPI с оптимизированными запросами к БД
- 🔐 **Безопасность**: JWT аутентификация с cookie, защита от CSRF, хеширование паролей bcrypt
- 📧 **Email сервис**: Подтверждение email, восстановление пароля через Celery задачи
- 💾 **Кэширование**: Redis для быстрого доступа к данным и сессий
- 🗄️ **База данных**: PostgreSQL с миграциями через Alembic
- 📦 **Файловое хранилище**: Интеграция с S3-совместимыми хранилищами
- 🎨 **Современный UI**: React 19 с TypeScript, Framer Motion анимации, Tailwind CSS
- 🔄 **Управление состоянием**: Zustand для простого и эффективного state management
- 📱 **Адаптивный дизайн**: Полностью responsive интерфейс для всех устройств
- 🧪 **Тестирование**: Pytest для backend тестов

## 🛠️ Технологии

### Backend
```
FastAPI          - Современный веб-фреймворк для API
SQLAlchemy       - ORM для работы с PostgreSQL
Alembic          - Миграции базы данных
Pydantic         - Валидация данных и настроек
Celery           - Асинхронные задачи (email рассылки)
Redis            - Кэширование и брокер сообщений
Passlib + bcrypt - Безопасное хеширование паролей
Python-Jose      - JWT токены
Aiobotocore      - Асинхронная работа с S3
Pytest           - Тестирование
```

### Frontend
```
React 19         - UI библиотека
TypeScript       - Типизированный JavaScript
Vite             - Сборщик проекта
React Router     - Маршрутизация
Zustand          - Управление состоянием
Axios            - HTTP клиент
Framer Motion    - Анимации
Tailwind CSS     - Utility-first CSS фреймворк
Lucide React     - Иконки
```

### Инфраструктура
```
Docker           - Контейнеризация
PostgreSQL       - База данных
Redis            - Кэш и брокер сообщений
S3               - Объектное хранилище
```

## 🚀 Быстрый старт

### Требования
- Python 3.13+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (опционально)

### Установка

#### 1. Клонируйте репозиторий
```bash
git clone https://github.com/yourusername/Aether.git
cd Aether
```

#### 2. Backend

```bash
cd backend

# Установите зависимости (используя pip)
pip install -e .

# Или используя poetry
poetry install

# Создайте .env.prod файл
cat > .env.prod << EOF
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/aether
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=aether-bucket
EOF

# Запустите миграции
alembic upgrade head

# Запустите сервер
uvicorn app.main:app --reload

# В отдельном терминале запустите Celery worker
celery -A app.core.celery_app worker --loglevel=info
```

#### 3. Frontend

```bash
cd frontend

# Установите зависимости
npm install

# Создайте .env.prod файл
echo "VITE_API_URL=http://localhost:8000" > .env.prod

# Запустите dev сервер
npm run dev
```

### 🐳 Docker (рекомендуется)

```bash
# В корне проекта
cd backend
docker-compose -f docker-compose.dev.yml up -d
```

## 📖 Документация

### API Endpoints

После запуска backend, документация доступна по адресам:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Основные маршруты

#### Аутентификация
```
POST   /auth/register          - Регистрация нового пользователя
POST   /auth/login             - Вход в систему
POST   /auth/logout            - Выход из системы
POST   /auth/verify-email      - Подтверждение email
POST   /auth/request-reset     - Запрос на сброс пароля
POST   /auth/reset-password    - Сброс пароля
```

#### Пользователи
```
GET    /users/me               - Получить текущего пользователя
PUT    /users/me               - Обновить профиль
DELETE /users/me               - Удалить аккаунт
```

#### Чаты
```
GET    /chats                  - Получить список чатов
POST   /chats                  - Создать новый чат
GET    /chats/{id}             - Получить чат по ID
PUT    /chats/{id}             - Обновить чат
DELETE /chats/{id}             - Удалить чат
```

## 🏗️ Структура проекта

```
Aether/
├── backend/
│   ├── app/
│   │   ├── auth/           # Модуль аутентификации
│   │   ├── users/          # Модуль пользователей
│   │   ├── chats/          # Модуль чатов
│   │   ├── core/           # Основные компоненты (DB, Redis, Config)
│   │   ├── services/       # Бизнес-логика (Email, Redis)
│   │   ├── tasks/          # Celery задачи
│   │   ├── utils/          # Утилиты (OAuth2, Hash, Cache)
│   │   ├── templates/      # Email шаблоны
│   │   └── migration/      # Alembic миграции
│   ├── tests/              # Тесты
│   └── pyproject.toml      # Зависимости Python
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   │   ├── auth/       # Компоненты аутентификации
│   │   │   ├── chat/       # Компоненты чата
│   │   │   └── common/     # Общие компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # API сервисы
│   │   ├── store/          # Zustand хранилища
│   │   └── utils/          # Утилиты
│   └── package.json        # Зависимости Node.js
│
└── assets/                 # Статические файлы (логотипы и т.д.)
```

## 💻 Разработка

### Backend

```bash
# Запуск тестов
pytest

# Запуск тестов с coverage
pytest --cov=app tests/

# Создание новой миграции
alembic revision --autogenerate -m "description"

# Применение миграций
alembic upgrade head

# Откат миграций
alembic downgrade -1

# Форматирование кода
black app/
isort app/

# Проверка типов
mypy app/
```

### Frontend

```bash
# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Просмотр production сборки
npm run preview

# Линтинг
npm run lint

# Проверка типов
npx tsc --noEmit
```

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
pytest tests/ -v
```

## 🚢 Деплой

### Backend

```bash
# Сборка Docker образа
docker build -t aether-backend .

# Запуск контейнера
docker run -p 8000:8000 --env-file .env.prod aether-backend
```

### Frontend

```bash
# Сборка для production
npm run build

# Папка dist/ готова к деплою на любой статический хостинг
```

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Сделайте Fork репозитория
2. Создайте ветку для новой функции (`git checkout -b feature/AmazingFeature`)
3. Зафиксируйте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Отправьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией Apache 2.0. Подробности в файле [LICENSE](LICENSE).

## 👤 Автор

**lorsan**
- Email: stasstrochewskij@gmail.com
- GitHub: [@lorsan](https://github.com/lorsan)

## 🙏 Благодарности

- [FastAPI](https://fastapi.tiangolo.com/) за отличный фреймворк
- [React](https://react.dev/) команде за мощную библиотеку
- Всем контрибьюторам open-source проектов, которые используются в Aether

---

<div align="center">
Сделано с ❤️ by lorsan
</div>
