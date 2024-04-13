#Используем линукс alpine с node 19
FROM node:19.5.0-alpine

#Указываем рабочую директорию
WORKDIR /app

#Скопируем package.json и package-lock.json внутрь контейнера /app
COPY package*.json ./

#Устанавливаем зависимости
RUN npm install

#Копируем оставшиеся приложения (Всё отсюда - туда, через 2 точки)
COPY . .

#Установить prisma
RUN npm install -g prisma

#Генерируем Prisma client
RUN prisma generate

#Копируем Prisma schema
COPY prisma/schema.prisma ./prisma/

#Открываем порт в нашем контейнере
EXPOSE 3000

#Запускаем сервер внутри контейнера
CMD ["npm", "start"]