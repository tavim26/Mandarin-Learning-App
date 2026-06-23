# ===== BUILD STAGE =====
FROM node:20-alpine AS build

WORKDIR /app

# Copiere package.json si instalare dependencies (cache layer)
COPY package.json .
COPY package-lock.json .
RUN npm ci

# Copiere cod sursa si build
COPY . .
RUN npm run build


# ===== RUNTIME STAGE =====
FROM nginx:alpine

# Copiere fisierele built din build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copiere configuratie Nginx custom
# necesar pentru React Router si evitarea 404 la refresh
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]