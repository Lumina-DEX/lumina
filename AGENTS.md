# Agent Notes

## Moon Verification

- If a `moon` command fails with config parsing errors or appears to use the wrong version, verify the repo toolchain first before assuming the repo is broken.
- In this repo, activate the shell hook with `eval "$(proto activate zsh --export)"`.
- Then confirm the active binary and version with `which moon` and `moon --version`.
- Use `.prototools` as the source of truth for the repo-pinned Moon version instead of hardcoding it here.
