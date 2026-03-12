---
id: T003
title: "Integrate helper into runbook"
status: done
blockedBy: []
owner: codex
created_at: 2026-03-12T11:43:58Z
updated_at: 2026-03-12T11:45:26Z
---
## Requirements

- Keep the runbook as the canonical operator and agent guide.
- Integrate `rollout-host.sh` into the runbook as the preferred agent path.
- Explicitly document that if the helper fails, the agent must continue by following the manual step breakdown in the runbook.
- Commit and push the current signer rollout changes for review on the existing branch.

## Test Plan

- BDD: validate that the runbook now presents the helper-first path plus the manual fallback path clearly.
- RED path:
- Confirm the current runbook still frames the helper as optional but not as the integrated preferred path.
- GREEN path:
- Re-read the updated runbook and verify the helper integration and fallback guidance are explicit.
- Re-run script syntax and helper checks to make sure the docs still match working commands before commit.

## RED Evidence

- `sed -n '1,260p' packages/signer/NIXOS_RUNBOOK.md`
- Failure summary: the runbook still lists the helper as an optional add-on instead of the preferred agent path with a clear manual fallback.

## GREEN Evidence

- `sed -n '1,260p' packages/signer/NIXOS_RUNBOOK.md`
- Result: the runbook now presents `rollout-host.sh` as the preferred agent path and explicitly instructs the agent to fall back to the manual step breakdown if the helper fails.
- `bash -n packages/signer/infra/scripts/check-host.sh packages/signer/infra/scripts/rebuild-host.sh packages/signer/infra/scripts/rollout-host.sh packages/signer/infra/scripts/validate-local-setup.sh packages/signer/infra/scripts/test-helper-flows.sh packages/signer/infra/scripts/lib/common.sh`
- Result: all updated infra scripts parsed successfully.
- `packages/signer/infra/scripts/test-helper-flows.sh`
- Result: helper script checks passed after the runbook integration update.
