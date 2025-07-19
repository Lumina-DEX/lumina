# Database Backup Setup

This document describes the automated database backup system for the signer service.

## Overview

The backup system automatically:

- Creates daily SQLite database backups
- Compresses them with gzip
- Uploads to Cloudflare R2 storage
- Sends heartbeat to BetterStack uptime monitoring
- Runs daily at midnight via cron

## Required Environment Variables

### Database Configuration

- `DB_FILE_NAME`: Path to the SQLite database file (supports `file://` prefix which will be automatically removed)

### Cloudflare R2 Configuration

- `R2_BUCKET_NAME`: Name of your R2 bucket
- `R2_ACCESS_KEY_ID`: R2 access key ID
- `R2_SECRET_ACCESS_KEY`: R2 secret access key
- `R2_ENDPOINT`: R2 endpoint URL (e.g., `https://your-account-id.r2.cloudflarestorage.com`)

### BetterStack Uptime Monitoring (Optional)

- `BETTERSTACK_HEARTBEAT_URL`: Full URL for BetterStack heartbeat endpoint

## How It Works

1. **Daily Schedule**: Cron runs the backup script at midnight (00:00) every day
2. **Database Backup**: Uses SQLite's `VACUUM INTO` command to create a clean backup
3. **Compression**: Compresses the backup with gzip to save storage space
4. **Upload**: Uses rclone to upload to R2 with a rolling daily naming scheme (`db-01.gz` to `db-31.gz`)
5. **Cleanup**: Removes local backup files after successful upload
6. **Monitoring**: Sends GET request to BetterStack heartbeat URL to confirm success

## Manual Backup

To run a backup manually:

```bash
# Inside the container
/usr/local/bin/backup-db.sh

# Or from outside (if you have the environment variables set)
docker exec <container-name> /usr/local/bin/backup-db.sh
```

## Backup Retention

The system uses a rolling 31-day backup scheme:

- Backups are named `db-01.gz` through `db-31.gz` based on the day of the month
- Each day overwrites the backup from the same day of the previous month
- This provides approximately 1 month of backup history

## Troubleshooting

### Check if cron is running:

```bash
# Inside container
service cron status
```

### View cron logs:

```bash
# Inside container  
grep CRON /var/log/syslog
```

### Test backup manually:

```bash
# Inside container
/usr/local/bin/backup-db.sh
```

### Check environment variables:

```bash
# Inside container
env | grep -E "(DB_FILE_NAME|R2_|BETTERSTACK_)"
```
