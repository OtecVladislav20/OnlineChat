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

## Deploy to VPS (Docker Compose)

Prereqs:
- A domain pointing to your VPS (recommended), ports `80/tcp`, `443/tcp`, `443/udp`, `7881/tcp`, `50000-50100/udp` open.
- Docker + Docker Compose on the server.

Steps:
1) Copy `.env.vps.example` to `.env.vps` and set:
   - `APP_DOMAIN` (e.g. `chat.example.com`)
   - `LIVEKIT_DOMAIN` (e.g. `livekit.example.com`)
   - `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` (must match `livekit.yaml`)

2) (Important) Change `keys` in `livekit.yaml` to the same `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`.

3) Deploy:

```bash
docker compose -f docker-compose.vps.yml --env-file .env.vps up -d --build
```

Caddy serves the frontend and proxies `/api` + `/socket.io` to the backend, and `LIVEKIT_DOMAIN` to LiveKit.

## VPS quick test (HTTP, no certificates)

If you want to quickly validate the deploy without configuring DNS/TLS, use `docker-compose.vps.http.yml`.
Note: most browsers will block microphone access on plain HTTP for a public IP, so voice publish may not work until HTTPS.

```bash
cp .env.vps.http.example .env.vps.http
# set APP_HOST to your server IP and set LIVEKIT_API_* to match livekit.yaml
docker compose -f docker-compose.vps.http.yml --env-file .env.vps.http up -d --build
```
