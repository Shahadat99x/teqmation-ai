# ClientFlow AI local n8n setup

This folder keeps ClientFlow AI's automation layer inside the repo, while still running it as a separate local service from the Next.js app and any future FastAPI runtime.

For local development, n8n runs with Docker Compose and uses its own Postgres container for persistence. It should not share the Supabase database.

## What this is for

- local self-hosted n8n development
- testing automation workflows against the app and Supabase
- keeping infra/config close to the repo without coupling n8n to the web runtime

## Architecture reminder

- `apps/web` owns dashboard and public UI
- `apps/api` owns backend business logic when it is expanded
- Supabase remains auth, DB, storage, and source of truth
- n8n is orchestration only

Do not move critical business rules into n8n.

## Prerequisites

- Docker Desktop
- Docker Compose

## Files in this folder

- `docker-compose.yml`: local n8n + dedicated Postgres runtime
- `.env.example`: local environment template
- workflow `.json` files: importable workflow scaffolds for the project

## First-time setup

1. Open a terminal in `infra/n8n`
2. Copy `.env.example` to `.env`
3. Set a strong `N8N_ENCRYPTION_KEY`
4. Set a strong `N8N_POSTGRES_PASSWORD`
5. Start the stack:

```bash
docker compose up -d
```

## Stop the stack

```bash
docker compose down
```

If you want to remove persistent local data too, run:

```bash
docker compose down -v
```

## Open the UI

Open:

```text
http://localhost:5678
```

On first run, n8n will ask you to create the owner account in the browser.

## How this connects to the app

The main app can keep using values like:

- `N8N_BASE_URL=http://localhost:5678`
- `N8N_WEBHOOK_SECRET=...`

Those stay in the app-level env files. The Docker Compose stack here is only for the local n8n runtime itself.

## Running from repo root

If you do not want to `cd` into this folder, you can start it from the repo root with:

```bash
docker compose -f infra/n8n/docker-compose.yml --env-file infra/n8n/.env up -d
```

## Notes

- data is persisted in named Docker volumes
- Postgres is internal to the Compose network and is not exposed on a host port by default
- this setup is for local development, not production hardening
