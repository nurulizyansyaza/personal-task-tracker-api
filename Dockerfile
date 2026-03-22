FROM node:20-alpine AS builder

WORKDIR /app

COPY personal-task-tracker-core ./personal-task-tracker-core
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY personal-task-tracker-core ./personal-task-tracker-core
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
