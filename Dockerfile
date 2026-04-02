# Étape 1: Build Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./

# Installer les dépendances
RUN npm ci

# Copier les fichiers d'environnement
COPY src/environments ./src/environments

# Copier le code source
COPY src ./src

# Build avec l'environnement docker
RUN npm run build -- --configuration=docker

# Étape 2: Servir avec Nginx
FROM nginx:alpine

# Supprimer la page par défaut
RUN rm -rf /usr/share/nginx/html/*

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 🔥 IMPORTANT: Copier depuis le dossier browser DIRECTEMENT vers la racine
COPY --from=build /app/dist/test-module-frontend/browser /usr/share/nginx/html

# 🔥 Donner les bonnes permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
