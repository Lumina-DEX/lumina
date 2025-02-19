# Signer Service

Signer service that can generate a proof given 2 tokens on a given network.

This is meant to be used by clients directly, and hopefully won't be needed
anymore with the multisig.

This can't run on cloudflare workers because of o1js limitations:

- FinalizationRegistry can't be used
- eval or new Function can't be used

## Usage

Use deno to run the service :

```bash
deno task dev
```

The server with listen on http://0.0.0.0:8000/.

## Runtime

This service use the Deno runtime, but this can easily be ported to Bun or to
Node.js.

## Deploy

We should containerize this service and deploy it to a big Hetzner server
(https://docs.docker.com/guides/deno/containerize/) In addition, we should also
include a CI pipeline to automate the deployment process with Pulumi
(https://timozander.de/blog/using-pulumi-with-hcloud/)
