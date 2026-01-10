FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY . .

# ARG для передачи переменных окружения на этапе сборки
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Собираем production build (Vite встроит переменные в код)
RUN npm run build

# Устанавливаем простой HTTP сервер для отдачи статики
RUN npm install -g serve

# Порт (только документация)
EXPOSE 3000

# Запускаем сервер для отдачи статики
CMD ["serve", "-s", "dist", "-l", "3000"]