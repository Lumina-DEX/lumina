# NixOS Layout

Files here are evaluated with:

```bash
nixos-rebuild switch --flake ./packages/signer/infra/nixos#<host>
```

Notes:

- `hosts/generated/` is for per-machine hardware configs from `nixos-anywhere`.
- `hosts/keys/` is for operator public keys and stays ignored by git.
- `lumina-signer.nix` defaults to a plain webserver container on purpose so host rollout stays
  simple while the signer-specific runtime model is still being designed.
