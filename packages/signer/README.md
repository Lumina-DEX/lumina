# Pool Creation Service

Server-side proof generation service for pool creation.

## Tech Stack

- **TypeScript**: Bun runtime
- **Database**: Drizzle ORM + PostgreSQL (Supabase)
- **Queue**: TanStack Pacer (in-memory, serial processing)
- **GraphQL**: Pothos + GraphQL Yoga (with built-in PubSub)
- **Secrets**: Infisical
- **Deployment**: Dokku on Hetzner

## Installation

This app use drizzle as ORM and infisical as vault

> **Note:** Drizzle v2 relations are used : https://rqbv2.drizzle-orm-fe.pages.dev/docs/relations-v1-v2

```bash
pnpm i
```

Create an .env file base on .env.example

## Database

### PostgreSQL (Local Development)

Start the PostgreSQL service using Docker Compose:

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 (database: `signer`, user: `postgres`, password: `postgres`).

Create and migrate the database:

```bash
moon signer:db-migrate && moon signer:db-seed
```

The application expects a `DATABASE_URL` environment variable. For local development:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signer"
```

### PostgreSQL (Production - Supabase)

For production, use Supabase:

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your database URL from Project Settings > Database
3. Set the `DATABASE_URL` environment variable to your Supabase connection string

## Development

Start the development environment:

1. **Start PostgreSQL**:
   ```bash
   moon signer:services-start
   ```

2. **Run migrations and seed** (first time only):
   ```bash
   moon signer:db-migrate && moon signer:db-seed
   ```

3. **Start the server**:
   ```bash
   moon signer:dev
   ```

Or run everything at once:

```bash
moon signer:all
```

The server compiles o1js contracts once at startup, then processes pool creation jobs serially as they arrive.

Use the GraphQL playground at http://localhost:3001/graphql to test the API.

**Available scripts:**

- `moon signer:services-start` - Start PostgreSQL container
- `moon signer:services-stop` - Stop containers
- `moon signer:dev` - Start server in watch mode
- `moon signer:all` - Start services, server, and web interface

## Deploy

We should containerize this service and deploy it to a big Hetzner server
(https://docs.docker.com/guides/deno/containerize/) In addition, we should also
include a CI pipeline to automate the deployment process with Pulumi
(https://timozander.de/blog/using-pulumi-with-hcloud/)

### Docker

Build the docker image from the root of the monorepo:

```bash
docker build -t luminadex-signer -f packages/signer/Dockerfile .
```

Create network and run the services:

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

Clean-up:

```bash
docker stop postgres-server && docker rm postgres-server
docker network rm lumina-net
```

### Dokku

Deploy the app with Dokku:

```bash
# Create the Dokku app
dokku apps:create pool-signer

# Set the Dockerfile path
dokku builder-dockerfile:set pool-signer dockerfile-path packages/signer/Dockerfile

# Set the build to use Dockerfile
dokku config:set pool-signer DOKKU_BUILD_ATTEMPT=dockerfile
```

Set the environment variables for the app:

```bash
dokku config:set pool-signer \
  DATABASE_URL=your_postgresql_database_url \
  INFISICAL_ENVIRONMENT=your_infisical_environment \
  INFISICAL_PROJECT_ID=your_infisical_project_id \
  INFISICAL_CLIENT_ID=your_infisical_client_id \
  INFISICAL_CLIENT_SECRET=your_infisical_client_secret
```

Configure the domain :
(Make sure the DNS record in cloudflare points to the server IP)

```bash
dokku domains:add pool-signer pool-signer.luminadex.com
dokku letsencrypt:enable pool-signer
dokku ports:set pool-signer http:80:3001
```

To inspect the logs :

```bash
dokku logs pool-signer -t
```

TODO :

- [x] Switch to PostgreSQL + Supabase for simplified database management
- [x] Domain config
- DB Clean-up script
- [] Firewall config
- [] CI dokku

## SQLite Backup (Legacy)

The previous SQLite backup implementation has been moved to `scripts/sqlite/` directory for reference. This includes:

- `scripts/sqlite/backup-db.sh` - Database backup script
- `scripts/sqlite/cron-wrapper.sh` - Cron wrapper script
- `scripts/sqlite/docker-entrypoint.sh` - Docker entrypoint with cron setup
- `scripts/sqlite/Dockerfile.sqlite` - Dockerfile with backup dependencies
- `scripts/sqlite/BACKUP.md` - Backup documentation

Use these files if you need to revert to SQLite with automated backups.

Create the sqlite db file and mount the storage :

```bash
sudo mkdir -p /usr/src/app/packages/signer/data
sudo touch /usr/src/app/packages/signer/data/db.sqlite
dokku storage:mount pool-signer /var/lib/dokku/data/pool-signer-data:/usr/src/app/packages/signer/data
sudo chmod 777 /var/lib/dokku/data/pool-signer-data
```
