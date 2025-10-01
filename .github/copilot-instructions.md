# Copilot instructions for this repo

This monorepo hosts Lumina apps and libraries. Use these notes to stay productive and avoid common pitfalls.

## Big picture

- Monorepo Tooling : moonrepo (see root `package.json`, root `.moon` directory and `moon.yml` files).

## Common tasks and commands

Moon will automatically install dependencies before running a task.

- Always run all commands from the monorepo root with the following syntax `moon run <project>:<task>`, for example: `moon run contracts:build`.
- Always look at project tasks in each directory `moon.yml` to see what is available.
- For the root `moon.yml` tasks, use `moon run <task>`, for example: `moon run format-all`.
- If a task output or dependencies are cached and you want to force a re-run, add the `-u` flag to the command.

## Conventions and patterns

- XState v5 is used.
- Do not edit generated/compiled folders like `.output/` or commit Cloudflare artifacts; use the scripts.

## Language Instructions

- Always use Typescript instead of Javascript
- Always prefer generating code from first principles than relying on non-specified libraries. If using a library is necessary, always ask first before adding it, unless the user explicitly ask for a specific library to implement something.

## Notes for this monorepo setup

- Both Bun and Node.js are used in this monorepo.
