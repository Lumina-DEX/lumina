# Pool CreationService

Pool CreationService that can generate a proof server side.

Tech stack :

- Typescript
  - Bun
  - pnpm
- SQL:
  - Drizzle ORM
  - PostgreSQL (Supabase)
- Queues:
  - BullMQ
  - Redis
- Graphql:
  - Pothos
  - Graphql Yoga
- Secrets Management:
  - Infisical

This is deployed on a Hetzner server using Dokku.

## Installation

This app use drizzle as ORM and infisical as vault

> **Note:** Drizzle v2 relations are used : https://rqbv2.drizzle-orm-fe.pages.dev/docs/relations-v1-v2

```bash
pnpm i
```

Create an .env file base on .env.example

## Database

### PostgreSQL (Local Development)

Start the PostgreSQL and Redis services using Docker Compose:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL on port 5432 (database: `signer`, user: `postgres`, password: `postgres`)
- Redis on port 6379

Create and migrate the database:

```bash
bun db:migrate && bun db:seed
```

The application expects a `DATABASE_URL` environment variable. For local development, use:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signer"
```

### PostgreSQL (Production - Supabase)

For production, use Supabase:

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your database URL from Project Settings > Database
3. Set the `DATABASE_URL` environment variable to your Supabase connection string

### Redis

Redis is included in the docker-compose.yml file and will start automatically with `docker-compose up -d`.

For standalone Redis, you can also run:

```bash
docker run -p 6379:6379 -d redis:8.0.2
```

## Server

To start the development environment:

1. **Start services** (PostgreSQL and Redis):
   ```bash
   bun run services:start
   ```

2. **Run migrations and seed** (first time only):
   ```bash
   bun run db:migrate && bun run db:seed
   ```

3. **Start the server** in development mode:
   ```bash
   bun run dev
   ```

Or run everything at once:

```bash
bun run all
```

Use the GraphQL playground at http://localhost:3001/graphql to test the API.
Refer to index.html to see usage client side.
The SDK includes a state machine that models the API usage.

**Available scripts:**

- `bun run services:start` - Start PostgreSQL and Redis containers
- `bun run services:stop` - Stop all containers
- `bun run dev` - Start server in watch mode
- `bun run all` - Start services, server, and web interface

## Deploy

We should containerize this service and deploy it to a big Hetzner server
(https://docs.docker.com/guides/deno/containerize/) In addition, we should also
include a CI pipeline to automate the deployment process with Pulumi
(https://timozander.de/blog/using-pulumi-with-hcloud/)

### Docker

To run locally the service and redis with docker:

Build the docker image from the root of the monorepo:

```bash
docker build -t luminadex-signer -f packages/signer/Dockerfile .
```

Create network and run redis and the signer service:

```bash
docker network create lumina-net

docker run -d --name redis-server --network lumina-net -p 6379:6379 redis:8.0.2

docker run --rm -it --network lumina-net -p 3000:3000 \
  -e REDIS_HOST=redis-server \
  -e REDIS_PORT=6379 \
  luminadex-signer
```

Clean-up :

```bash
# Stop and remove the redis container
docker stop redis-server && docker rm redis-server

# Remove the network
docker network rm lumina-net
```

### Dokku

Here are the full instructions to deploy the app with Dokku.
Note that once the CI is set, git operations will automaticall deploy the app.

```bash
# Create the Dokku app
dokku apps:create pool-signer
# Install the Redis plugin
dokku plugin:install https://github.com/dokku/dokku-redis.git --name redis
# Create a Redis service for the app
dokku redis:create bullmq-pool-signer
# Link the Redis service to the app
dokku redis:link bullmq-pool-signer pool-signer
# Set the Dockerfile path
dokku builder-dockerfile:set pool-signer dockerfile-path packages/signer/Dockerfile
# Set the build attempt to use the Dockerfile
dokku config:set pool-signer DOKKU_BUILD_ATTEMPT=dockerfile
```

Set the environment variables for the app:

```bash
dokku config:set pool-signer \
  DATABASE_URL=your_postgresql_database_url \
  INFISICAL_ENVIRONMENT=your_infisical_environment \
  INFISICAL_PROJECT_ID=your_infisical_project_id \
  INFISICAL_SECRET_NAME=your_infisical_secret_name \
  INFISICAL_CLIENT_ID=your_infisical_client_id \
  INFISICAL_CLIENT_SECRET=your_infisical_client_secret
```

Configure the domain :

```bash
dokku domains:add pool-signer yourdomain.com
```

TODO :

- [x] Switch to PostgreSQL + Supabase for simplified database management
- [] Domain config
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
