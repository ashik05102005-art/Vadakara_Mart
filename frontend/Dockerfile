# Stage 1: Build React bundles using node
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve compiled HTML/JS/CSS assets using Nginx slim
FROM nginx:alpine-slim

# Copy static builds
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Nginx standard port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
