#!/bin/bash -x

# Ensure script stops when commands fail, and that a failed pipe command fails the script.
set -eo pipefail

# Get database path from environment variable and remove file:// prefix if present
DB_PATH=${DB_FILE_NAME#file://}

# Ensure DB_PATH is set
if [ -z "$DB_PATH" ]; then
    echo "Error: DB_FILE_NAME environment variable is not set" >&2
    exit 1
fi

# Create backup filename with timestamp
BACKUP_FILE="/tmp/db-backup-$(date +%Y%m%d-%H%M%S).db"

echo "Backing up database from $DB_PATH to $BACKUP_FILE..."

# Backup & compress our database. Using .backup is the standard for online backups.
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'" | gzip > "${BACKUP_FILE}.gz"

echo "Uploading backup to R2..."

# Upload backup to R2.
rclone copy "${BACKUP_FILE}.gz" "r2:${R2_BUCKET_NAME}/db-$(date +%d).gz" --config /dev/null \
    --s3-provider=Cloudflare \
    --s3-access-key-id="$R2_ACCESS_KEY_ID" \
    --s3-secret-access-key="$R2_SECRET_ACCESS_KEY" \
    --s3-endpoint="$R2_ENDPOINT"

echo "Cleaning up local backup file..."
rm -f "${BACKUP_FILE}.gz"

# Notify BetterStack uptime that backup completed successfully.
if [ -n "$BETTERSTACK_HEARTBEAT_URL" ]; then
    echo "Sending heartbeat to BetterStack..."
    curl --silent --show-error -X GET "$BETTERSTACK_HEARTBEAT_URL"
fi

echo "Backup completed successfully."