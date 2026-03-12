# Signer Infra Scripts

Scripts here are deliberately small:

- `validate-local-setup.sh`: verify the operator shell is ready before the agent starts bootstrap
- `rollout-host.sh`: optional helper that chains the documented agent rollout steps
- `rebuild-host.sh`: apply the NixOS host config with a signer image digest
- `check-host.sh`: verify SSH, systemd units, and HTTPS
- `test-helper-flows.sh`: local validation for the helper scripts' setup checks

Copy `signer-fleet.env.example` to `signer-fleet.env` before using them locally.
