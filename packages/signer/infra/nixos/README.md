# NixOS Layout

Files here are evaluated with:

```bash
nixos-rebuild switch --flake ./packages/signer/infra/nixos#<host>
```

Notes:

- `lib/mk-signer-host.nix` keeps the production and local test hosts on the
  same shared signer host shape.
- `hosts/generated/` is for per-machine hardware configs from `nixos-anywhere`.
- `hosts/keys/` is for operator public keys and stays ignored by git.
- The active container image is injected at rebuild time through `LUMINA_SIGNER_IMAGE_REF`.
- `local-arm64-signer-test` is an OrbStack-only verification host for local
  `aarch64-linux` rebuilds. It should be evaluated from a repo `path:` flake
  inside the VM so the local workspace is used directly.
