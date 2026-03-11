# Signer Infra Scripts

Scripts here are deliberately small:

- `rebuild-host.sh`: apply the NixOS host config with a signer image digest
- `check-host.sh`: verify SSH, systemd units, and HTTPS

Copy `signer-fleet.env.example` to `signer-fleet.env` before using them locally.
