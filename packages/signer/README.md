# Pool Creation Signer Service

Server-side proof generation for pool creation and factory deployment on Mina-compatible blockchains.

## Tech Stack

- **TypeScript** / Node.js runtime
- **PostgreSQL** (Supabase) with **Drizzle ORM** (v2 relations)
- **GraphQL Yoga** + **Pothos** schema builder (with built-in PubSub for subscriptions)
- **Infisical** for secrets management
- **NixOS** + **Podman** + **Caddy** for deployment

## Architecture

Each signer server is dedicated to a specific environment, determined by the `Host` header:

| Hostname                            | Allowed Networks              |
| ----------------------------------- | ----------------------------- |
| `mina-mainnet.signer.luminadex.com` | `mina:mainnet`                |
| `zeko-testnet.signer.luminadex.com` | `mina:devnet`, `zeko:testnet` |
| `localhost` / `127.0.0.1`           | All networks (dev fallback)   |

The allowed networks are resolved once at startup from the system hostname (`os.hostname()`), not from request headers. Requests for a mismatched network are rejected immediately at the GraphQL resolver level. Contracts are compiled once per server lifecycle since each server handles a single proving-key environment.

## Local Development

### Prerequisites

- Node.js, pnpm
- Docker (for PostgreSQL)

### Setup

1. Copy environment config:
   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:
   ```bash
   moon signer:services-start
   ```

3. Run migrations and seed (first time only):
   ```bash
   moon signer:db-migrate && moon signer:db-seed
   ```

4. Start the server:
   ```bash
   moon signer:dev
   ```

Or run everything at once:

```bash
moon signer:all
```

The GraphQL playground is available at http://localhost:3001/graphql.

### Available Commands

- `moon signer:services-start` — Start PostgreSQL container
- `moon signer:services-stop` — Stop containers
- `moon signer:dev` — Start server in watch mode
- `moon signer:all` — Start services, server, and web interface
- `moon signer:test` — Run tests

## Docker

Build the image from the monorepo root:

```bash
docker build -t luminadex-signer -f packages/signer/Dockerfile .
```

Run with PostgreSQL:

```bash
docker network create lumina-net

docker run -d --name postgres-server --network lumina-net -p 5432:5432 \
  -e POSTGRES_DB=signer \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:17-alpine

docker run --rm -it --network lumina-net -p 3001:3001 \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres-server:5432/signer \
  -e INFISICAL_ENVIRONMENT=your_environment \
  -e INFISICAL_PROJECT_ID=your_project_id \
  -e INFISICAL_CLIENT_ID=your_client_id \
  -e INFISICAL_CLIENT_SECRET=your_client_secret \
  luminadex-signer
```

## Deployment

Signer servers run on dedicated NixOS machines managed via the infrastructure files in this package:

- **Runbook**: `NIXOS_RUNBOOK.md`
- **NixOS configs**: `infra/nixos/`
- **Operator and CI scripts**: `infra/scripts/`

See the runbook for full provisioning, deployment, and troubleshooting instructions.
