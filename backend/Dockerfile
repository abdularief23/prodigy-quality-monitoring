FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache sqlite && npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
