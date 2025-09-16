# Copilot instructions for this repo

This monorepo hosts Lumina apps and libraries. Use these notes to stay productive and avoid common pitfalls.

## Big picture

- Monorepo: moonrepo (see root `package.json` and `.moon` directory).

## Common tasks and commands

To install everything, run `pnpm i` from the root.

Always run all command from the root using moon.
Always look at project tasks in each directory `moon.yml` to see what is available.

## Conventions and patterns

- XState v5 is used.
- Do not edit generated/compiled folders like `.output/` or commit Cloudflare artifacts; use the scripts.

## Language Instructions

- Always use Typescript instead of Javascript
- Always prefer first principles to adding additional libraries. If using a library is necessary, always ask first before adding it, unless the user explicitly ask for a specific library to implement something.

## Notes for this monorepo setup

- Bun is only required when running certain scripts; standard builds use Node.
- Alwaus usasks.
