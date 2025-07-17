# Pool CreationService

Pool CreationService that can generate a proof server side.

Tech stack :

- Typescript
  - Bun
  - pnpm
- SQL:
  - Drizzle ORM
  - SQLite
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

### SQlite

Create the sqlite db and populate it :

```bash
bun db:reset && bun db:migrate && bun db:seed
```

### Redis

To start redis, use docker or docker-compose

```bash
docker run -p 6379:6379 -d redis:8.0.2
```

or

```bash
docker-compose up -d
```

## Server

To start the graphql server in dev mode, run:

```bash
bun run dev
```

Use the graphql playground at http://localhost:3001/graphql to test the API.
Refer to index.html to see usage client side.
The SDK includes a state machine that models the API usage.

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

```bash
# Create the Dokku app
dokku apps:create pool-signer
# Install the Redis plugin
dokku plugin:install https://github.com/dokku/dokku-redis.git --name redis
# Create a Redis service for the app
dokku redis:create bullmq-pool-signer
# Link the Redis service to the app
dokku redis:link bullmq-pool-signer pool-signer
# Set the build context to the root of the monorepo
dokku builder:set pool-signer build-dir .
# Set the Dockerfile path
dokku builder-dockerfile:set pool-signer dockerfile-path packages/signer/Dockerfile
# Set the build attempt to use the Dockerfile
dokku config:set pool-signer DOKKU_BUILD_ATTEMPT=dockerfile
```

Create the sqlite db file and mount the storage :

```bash
sudo mkdir -p /usr/src/app/packages/signer/data
sudo touch /usr/src/app/packages/signer/data/db.sqlite
dokku storage:mount pool-signer /var/lib/dokku/data/pool-signer-data:/usr/src/app/packages/signer/data
sudo chmod 777 /var/lib/dokku/data/pool-signer-data
```

Set the environment variables for the app:

```bash
dokku config:set pool-signer DB_FILE_NAME=file:/usr/src/app/packages/signer/data/db.sqlite INFISICAL_ENVIRONMENT=your_infisical_environmentINFISICAL_PROJECT_ID=your_infisical_project_id INFISICAL_SECRET_NAME=your_infisical_secret_name INFISICAL_CLIENT_ID=your_infisical_client_id INFISICAL_CLIENT_SECRET=your_infisical_client_secret
```
