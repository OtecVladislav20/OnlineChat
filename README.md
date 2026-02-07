# OnlineChat

Dev stack: Express + Socket.IO + MongoDB + React (Vite) + TypeScript.

## Local start

1) Start infra:

```bash
docker compose up -d
```

2) Backend:

```bash
cd backend
copy .env.example .env
npm run dev
```

3) Frontend:

```bash
cd frontend
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Voice (LiveKit)

Voice channels use a local LiveKit server from `docker-compose.yml` (default `http://localhost:7880`).
