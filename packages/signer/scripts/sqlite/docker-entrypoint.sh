#!/bin/sh
set -e

# --- Runtime Setup (as root) ---
echo "Running runtime setup as root..."

# Save the current environment variables to a file for the cron job
printenv | sed 's/^\(.*\)$/export \1/g' > /etc/environment

# Create a simple cron job that uses a wrapper script
echo "0 0 * * * root /usr/local/bin/cron-wrapper.sh" > /etc/cron.d/backup-job
chmod 0644 /etc/cron.d/backup-job

# Start the cron daemon in the background
cron

# --- Database Migrations (as bun user) ---
echo "Running database migrations as bun user..."
su - bun -c "cd /usr/src/app/packages/signer && bun run db:migrate && bun run db:seed"

# --- Start Main Application ---
echo "Starting application..."
exec su - bun -c "cd /usr/src/app/packages/signer && bun run start"