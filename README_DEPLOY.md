# PIXO local e VPS

O projeto usa:

- Expo para mobile e web/PWA;
- API Node/TypeScript em `api/server.ts`;
- PostgreSQL com schema em `db/schema.sql`;
- Docker Compose para subir app e banco no mesmo padrão dos outros apps.

## Local

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Configure `OPENAI_API_KEY` apenas no `.env`.

Suba o banco:

```bash
docker compose up -d postgres
```

Rode a API:

```bash
npm run api:dev
```

Rode o app mobile:

```bash
npx expo start --tunnel
```

Rode web/PWA:

```bash
npx expo start --web
```

## VPS

Depois de copiar o projeto para a VPS:

```bash
cp .env.example .env
nano .env
docker compose up -d --build
```

Rotas principais:

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/bootstrap`
- `GET /api/mentor/messages`
- `POST /api/mentor/message`
