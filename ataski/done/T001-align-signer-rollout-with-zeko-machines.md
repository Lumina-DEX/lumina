---
id: T001
title: "Align signer rollout with zeko-machines"
status: done
blockedBy: []
owner: codex
created_at: 2026-03-12T10:19:51Z
updated_at: 2026-03-12T10:34:31Z
---
## Requirements

- Compare the signer NixOS rollout structure with the sibling `zeko-machines` repo and apply the relevant patterns here.
- Remove the unnecessary Postgres service setup from `.github/workflows/signer-image.yml`.
- Reduce the operator-facing runbook to local prerequisites only: SSH aliases, local env file, required binaries, and host secrets creation.
- Make the agent-driven flow explicit: add a script that validates the operator shell setup and then performs the rollout steps.
- Keep the signer NixOS layout modular and dry, and avoid tracked bootstrap-only artifacts or guidance that does not belong in the steady-state workflow.

## Test Plan

- BDD: validate the operator/agent workflow contract through script behavior and repo-level config checks.
- RED path:
- Confirm the current image workflow still provisions Postgres unnecessarily.
- Confirm the current runbook still mixes operator actions and agent actions.
- GREEN path:
- Verify the workflow no longer contains the Postgres service.
- Verify the new agent entrypoint fails fast on missing operator prerequisites and passes syntax checks.
- Verify workflow YAML parses successfully.

## RED Evidence

- `rg -n "postgres|services:" .github/workflows/signer-image.yml`
- Failure summary: `signer-image.yml` still defines a `postgres` service and `DATABASE_URL`, even though the workflow only builds and pushes the container image.
- `sed -n '1,220p' packages/signer/NIXOS_RUNBOOK.md`
- Failure summary: the runbook still includes detailed manual rollout actions and duplicates `nixos-anywhere` in both operator and agent sections instead of treating operator prep as strict prerequisites.

## GREEN Evidence

- `bash -n packages/signer/infra/scripts/check-host.sh packages/signer/infra/scripts/rebuild-host.sh packages/signer/infra/scripts/rollout-host.sh packages/signer/infra/scripts/validate-local-setup.sh packages/signer/infra/scripts/lib/common.sh`
- Result: all updated shell scripts parsed successfully.
- `ruby -e 'require "yaml"; %w[.github/workflows/signer-image.yml .github/workflows/signer-deploy-testnet.yml .github/workflows/signer-promote.yml].each { |p| YAML.load_file(p); puts "OK #{p}" }'`
- Result: all signer workflows parsed successfully.
- `orb -m lumina-signer-verify -u root sh -lc 'systemctl is-active lumina-signer caddy; podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'`
- Result: `lumina-signer` and `caddy` were both `active`, and the container was running on `127.0.0.1:3001`.
- `orb -m lumina-signer-verify -u root sh -lc 'curl -fsSI http://127.0.0.1:3001/ | head -n 1; curl -kfsSI --resolve localhost:443:127.0.0.1 https://localhost/ | head -n 1'`
- Result: both the direct container port and the HTTPS proxy path returned `200`.
