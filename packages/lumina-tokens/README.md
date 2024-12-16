# Tokens Service

Private Internal API that can return the list of tokens from the blockchain using o1js.

This is meant to be used by the cdn to sync the blockchain state since o1js can't be used in cloudflare workers.

- FinalizationRegistry can't be used
- eval or new Function can't be used

## Deploy

Use the deploy script and make sure you have an .env file with correct variable.

```
deno run deploy
```
