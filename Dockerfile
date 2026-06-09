FROM node:22-alpine AS build

WORKDIR /workspace

COPY fichaje-frontend/package.json fichaje-frontend/package-lock.json ./fichaje-frontend/

WORKDIR /workspace/fichaje-frontend
RUN npm ci --legacy-peer-deps

WORKDIR /workspace
COPY fichaje-frontend/ ./fichaje-frontend/
COPY fichaje-backend/docs/ ./fichaje-backend/docs/

WORKDIR /workspace/fichaje-frontend
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:1.27-alpine

COPY fichaje-frontend/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/fichaje-frontend/dist /usr/share/nginx/html

EXPOSE 80
