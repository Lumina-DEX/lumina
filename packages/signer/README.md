# Signer Service

Signer service that can generate a proof given 2 tokens on a given network.

This is meant to be used by clients directly, and hopefully won't be needed
anymore with the multisig.

This can't run on cloudflare workers because of o1js limitations:

- FinalizationRegistry can't be used
- eval or new Function can't be used

## Usage

Use redis, expressJs and bullMQ

Launch redis first in docker :

```bash
docker run -p 6379:6379 -d redis:8.0.2
```

Buil and run :

```bash
pnpm run build
pnpm run start
```

The server with listen on http://0.0.0.0:3000/.

Create pool post url :

http://localhost:3000/create-pool

Create pool frontend url :

http://localhost:3000/pool

Example data :

```
{
    "tokenA": "MINA",
    "tokenB": "B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW",
    "user":"B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65"
}
```

Curl example :

```
curl --location 'http://localhost:3000/create-pool' \
--header 'Content-Type: application/json' \
--data '{
    "tokenA": "MINA",
    "tokenB": "B62qqbQt3E4re5VLpgsQnhDj4R4bYvhXLds1dK9nRiUBRF9wweFxadW",
    "user":"B62qkjzL662Z5QD16cB9j6Q5TH74y42ALsMhAiyrwWvWwWV1ypfcV65"
}'
```

## Deploy

We should containerize this service and deploy it to a big Hetzner server
(https://docs.docker.com/guides/deno/containerize/) In addition, we should also
include a CI pipeline to automate the deployment process with Pulumi
(https://timozander.de/blog/using-pulumi-with-hcloud/)
