---
id: T002
title: "Separate runbook roles and type host data"
status: done
blockedBy: []
owner: codex
created_at: 2026-03-12T11:27:52Z
updated_at: 2026-03-12T11:38:21Z
---
## Requirements

- Keep the runbook as the canonical rollout document, with operator steps and agent steps clearly separated.
- Keep the shell rollout helper, but present it as optional support for the agent section rather than the canonical procedure.
- Add a minimal typed host-data layer for the signer NixOS hosts so the shared modules consume structured host settings instead of ad hoc positional constructor arguments.
- Keep the recent cleanup that removed unnecessary Postgres setup from the image workflow.
- Add direct validation for the shell helper flow so the scripts are not justified by syntax checks alone.

## Test Plan

- BDD: verify the documented operator/agent split and the agent helper behavior through concrete script and config checks.
- RED path:
- Confirm the runbook currently implies the rollout helper is the primary agent action instead of documenting the agent steps directly.
- Confirm the Nix host definitions are still only lightly structured and not yet represented as typed host data.
- GREEN path:
- Validate the updated scripts with direct failure-path coverage.
- Parse the workflow YAML after edits.
- Re-run the local OrbStack NixOS verification host checks if the Nix structure changes in a way that could affect evaluation.

## RED Evidence

- `sed -n '1,220p' packages/signer/NIXOS_RUNBOOK.md`
- Failure summary: the current runbook makes `rollout-host.sh` the primary agent action rather than documenting the concrete agent steps as the source of truth.
- `sed -n '1,220p' packages/signer/infra/nixos/lib/mk-signer-host.nix`
- Failure summary: host inputs are still passed as loose constructor arguments rather than a small typed host-data schema.

## GREEN Evidence

- `bash -n packages/signer/infra/scripts/check-host.sh packages/signer/infra/scripts/rebuild-host.sh packages/signer/infra/scripts/rollout-host.sh packages/signer/infra/scripts/validate-local-setup.sh packages/signer/infra/scripts/test-helper-flows.sh packages/signer/infra/scripts/lib/common.sh`
- Result: all updated infra scripts parsed successfully.
- `packages/signer/infra/scripts/test-helper-flows.sh`
- Result: direct helper-script checks passed, including a real regression catch and fix for `SIGNER_IMAGE_REF` being read before `signer-fleet.env` was sourced.
- `ruby -e 'require "yaml"; %w[.github/workflows/signer-image.yml .github/workflows/signer-deploy-testnet.yml .github/workflows/signer-promote.yml].each { |p| YAML.load_file(p); puts "OK #{p}" }'`
- Result: all signer workflows parsed successfully.
- `orb -m lumina-signer-verify -u root sh -lc 'nix eval --impure --json --no-write-lock-file path:/mnt/mac/Users/hebilicious/GitHub/lumina/monorepo/packages/signer/infra/nixos#nixosConfigurations.local-arm64-signer-test.config.lumina.signer.containerPort'`
- Result: the local OrbStack validation host now evaluates `lumina.signer.containerPort` to `80`, matching the dummy nginx image used for local verification.
