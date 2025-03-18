# CLAUDE.md - Lumina SDK

This is an SDK for a DEX (Decentralized Exchange) called Lumina on Mina compatible Blockchain.

## Build Commands

- Build: `pnpm build`
- Lint: `pnpm lint`
- Lint & Fix: `pnpm lint:fix`
- Format Check: `pnpm format`
- Format Fix: `pnpm format:fix`
- Tests: `pnpm test` (Note: Currently just echoes success)
- Documentation: `pnpm docs:dev`

## Code Style

- TypeScript with strict typing, using ESM modules
- Tabs for indentation, 100 character line width
- No semicolons (ASI style)
- Double quotes preferred for strings
- No trailing commas
- Export all public APIs through `index.ts` files
- Use descriptive type annotations and interfaces
- Use XState for state machines
- Use `consola` for logging
- GraphQL with gql.tada for type-safe queries
- Annotate deprecated functions with JSDoc `@deprecated`

## Project Structure

- `/src/constants` - Network and config constants
- `/src/dex` - DEX implementation
- `/src/graphql` - GraphQL schemas and clients
- `/src/helpers` - Utility functions
- `/src/machines` - XState machines
