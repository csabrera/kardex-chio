# Development & Build stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3001

# Development mode uses npm run start:dev, production uses node dist/main.js
CMD ["npm", "run", "start:dev"]
