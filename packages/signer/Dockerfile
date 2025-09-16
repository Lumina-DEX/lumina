# syntax=docker/dockerfile:1.7-labs
# Stage 1: Base image with Bun
# Using the official Bun image for a lean and fast environment.
FROM oven/bun:1 AS base
WORKDIR /app

# Stage 2: Install system dependencies for the base image
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt update && apt install -y git unzip gzip xz-utils curl

# Set the PROTO_HOME environment variable for all subsequent layers
ENV PROTO_HOME="/usr/local/proto"

# Set the default shell to bash 
SHELL ["/bin/bash", "-c"]

# Execute the installation in a single, clean RUN command.
RUN curl -fsSL https://moonrepo.dev/install/proto.sh | bash -s -- --yes

# Add the proto binary directory to the PATH
ENV PATH="$PATH:$PROTO_HOME/bin"
ENV PATH="$PROTO_HOME/shims:$PATH"

RUN proto --version
COPY .prototools ./.prototools
RUN proto install moon
FROM base AS builder
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY package.json ./
COPY patches ./patches/
COPY .moon ./.moon
COPY pnpm-lock.yaml ./

# Copy all package.json files from the monorepo packages
COPY --parents packages/*/package.json .

RUN moon setup
RUN pnpm fetch

COPY packages/contracts/ ./packages/contracts/
COPY packages/sdk/ ./packages/sdk/
COPY packages/signer/ ./packages/signer/

RUN moon signer:build

# Stage 3: Production image
# This is the final image that will be deployed.
FROM base AS production
WORKDIR /app

# Copy server from the build stage
COPY --from=builder --chown=bun:bun /app/ .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["moon", "signer:start"]