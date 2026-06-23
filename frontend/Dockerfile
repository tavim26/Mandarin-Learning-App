FROM node:20-alpine AS build

WORKDIR /app

# Copiere package.json si instalare dependencies (cache layer)
COPY package.json .
COPY package-lock.json .
RUN npm ci

# Copiere cod sursa si build
COPY . .
RUN npm run build

# Runtime stage — Nginx pentru servirea fisierelor statice
FROM nginx:alpine

# Copiere fisierele built din build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expune portul standard HTTP
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]