# NixOS Layout

Files here are evaluated with:

```bash
nixos-rebuild switch --flake ./packages/signer/infra/nixos#<host>
```

Notes:

- `hosts/generated/` is for per-machine hardware configs from `nixos-anywhere`.
- `hosts/keys/` is for operator public keys and stays ignored by git.
- The active container image is injected at rebuild time through `LUMINA_SIGNER_IMAGE_REF`.
