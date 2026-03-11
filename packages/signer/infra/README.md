# Signer Infra

This directory keeps the signer rollout files close to the signer package instead of spreading
them across the repo.

Contents:

- `nixos/`: declarative host modules and host configs
- `scripts/`: small operator and CI helpers

Current scope:

- bootstrap fresh Hetzner servers into NixOS
- rebuild hosts with a smoke-test container image
- seed signer permissions directly in Postgres

It intentionally does not contain an app-specific release system yet. The first rollout step is
just enough to prove the server, Caddy, Podman, and SSH path are healthy.
