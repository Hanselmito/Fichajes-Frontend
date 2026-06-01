# Fichaje Frontend

Plantilla inicial de React + TypeScript para el nuevo frontend externo de fichaje.

## Objetivo

- Consumir exclusivamente el backend Laravel en `../fichaje-backend`.
- Generar tipos desde `../fichaje-backend/docs/openapi.yaml`.
- Restaurar sesion por bearer token.
- Construir navegacion inicial a partir de `GET /auth/capabilities`.

## Variables de entorno

Crear `.env.local` a partir de `.env.example` si hace falta personalizar el backend:

```bash
VITE_API_BASE_URL=/api
VITE_BACKEND_PROXY_TARGET=http://127.0.0.1:8000
```

Uso recomendado en local:

- arrancar Laravel en `http://127.0.0.1:8000`
- arrancar este frontend en `http://127.0.0.1:5173`
- dejar que Vite proxie `/api` al backend

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run generate:api
```

## Flujo de integracion

1. `npm run generate:api` genera `src/api/generated.ts` desde el OpenAPI del backend.
2. El cliente usa `openapi-fetch` con `Authorization: Bearer <token>`.
3. La sesion se restaura con `/auth/me` y `/auth/capabilities`.
4. El dashboard inicial consume `/dashboard` y muestra las secciones disponibles segun permisos.

## Limitaciones conocidas

- El backend actual no revoca tokens server-side en logout.
- El backend sigue usando un contrato legacy en algunos recursos; el cliente trata `success=false` como error funcional.
- Para produccion conviene subir Node a una version que satisfaga exactamente los engines de Vite y ESLint.
