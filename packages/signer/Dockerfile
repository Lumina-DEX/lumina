# Stage 1: Base image with Bun
# Using the official Bun image for a lean and fast environment.
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Stage 2: Install all dependencies
# This stage is dedicated to installing dependencies for the entire monorepo.
# It leverages Docker's layer caching. This layer only gets rebuilt when
# package manager files change.
FROM base AS builder
WORKDIR /usr/src/app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY package.json ./
COPY patches ./patches/

# Copy all package.json files from the monorepo packages
# This is crucial for pnpm to understand the workspace structure and dependencies.
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/signer/package.json ./packages/signer/

# Copy the lockfile
COPY pnpm-lock.yaml ./

# Copy source code for dependencies
COPY packages/contracts ./packages/contracts
COPY packages/sdk ./packages/sdk

# Install all dependencies using pnpm.
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN bun i -g pnpm
RUN pnpm install

# Although there is no explicit build step, we run bun install
# to ensure all necessary setup for the signer package is complete.
# We are targeting the signer package specifically.
WORKDIR /usr/src/app/packages/contracts
RUN pnpm run build

WORKDIR /usr/src/app/packages/sdk
RUN pnpm run build

# Copy the source code for the signer package
COPY packages/signer/ ./packages/signer/

# Copy o1js cache files. This is important for o1js to work correctly
# without needing to regenerate them on every start.
# COPY packages/signer/cache ./packages/signer/cache


# Stage 3: Production image
# This is the final image that will be deployed.
FROM base AS production
WORKDIR /usr/src/app

# Copy built application and dependencies from the builder stage
COPY --from=builder --chown=bun:bun /usr/src/app/ ./

# Set the user to the non-root user
USER bun

# Expose the port the app will run on.
EXPOSE 3001
WORKDIR /usr/src/app/packages/signer

# Run database migrations and start the application
CMD ["bun", "run", "start"]
