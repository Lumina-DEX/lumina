# Local Signer Secrets

Create one local `*.env` file here per target host and keep them uncommitted.

These files are operator-managed local inputs for the rollout scripts. The agent may upload them
to the host, but they must not be committed, copied into the Nix store, or stored in CI.

Expected filenames:

- `zeko-testnet-signer.env`
- `mina-mainnet-signer.env`
- `zeko-mainnet-signer.env`
