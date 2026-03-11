# Signer Infra

This directory keeps the signer rollout files close to the signer package instead of spreading
them across the repo.

Contents:

- `nixos/`: declarative host modules and host configs
- `scripts/`: small operator and CI helpers

Current scope:

- bootstrap fresh Hetzner servers into NixOS
- rebuild hosts with a signer image digest from GHCR
- keep the seed flow anchored to `packages/signer/scripts/seed.ts`

The operator prepares the local shell environment first, then the agent or CI can execute the
host rollout steps from the runbook.
