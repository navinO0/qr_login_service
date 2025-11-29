# Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app


COPY package*.json ./
RUN npm ci --production

COPY . .

ENV PORT=3009
EXPOSE 3009

CMD ["node", "main.js"]
