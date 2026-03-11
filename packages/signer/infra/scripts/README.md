# Signer Infra Scripts

Scripts here are deliberately small:

- `rebuild-smoke-host.sh`: apply the NixOS host config and run the smoke image
- `check-smoke-host.sh`: verify SSH, systemd units, and HTTPS
- `bootstrap-signers.sh`: write signer rows directly to Postgres
- `test-blocklist.sh`: confirm the blocklist guard fails closed

Copy `signer-fleet.env.example` to `signer-fleet.env` before using them locally.
