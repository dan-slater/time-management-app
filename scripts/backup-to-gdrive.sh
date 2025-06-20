#!/bin/bash

# Time Management App - Google Drive Backup Script
# Backs up application data to Google Drive and manages retention

set -e

# Configuration
BACKUP_DIR="/var/backups/time-management"
DATA_DIR="/mnt/time-management-data/data"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="time-management-backup-${TIMESTAMP}"

echo "🔄 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Create comprehensive backup package
TEMP_BACKUP="/tmp/${BACKUP_NAME}"
mkdir -p "${TEMP_BACKUP}"

echo "📦 Creating backup package..."

# Copy current data
cp "${DATA_DIR}/tasks.json" "${TEMP_BACKUP}/"
cp "${DATA_DIR}/events.json" "${TEMP_BACKUP}/"
cp "${DATA_DIR}/shopping.json" "${TEMP_BACKUP}/" 2>/dev/null || echo "[]" > "${TEMP_BACKUP}/shopping.json"

# Copy snapshots
cp -r "${DATA_DIR}/snapshots" "${TEMP_BACKUP}/" 2>/dev/null || mkdir -p "${TEMP_BACKUP}/snapshots"

# Create backup metadata
cat > "${TEMP_BACKUP}/backup-info.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%03NZ")",
  "hostname": "$(hostname)",
  "backup_type": "deployment",
  "data_size": "$(du -sh ${DATA_DIR} | cut -f1)",
  "files_included": [
    "tasks.json",
    "events.json", 
    "shopping.json",
    "snapshots/"
  ],
  "retention_days": ${RETENTION_DAYS}
}
EOF

# Create compressed archive
cd /tmp
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
BACKUP_FILE="/tmp/${BACKUP_NAME}.tar.gz"

echo "📁 Backup created: ${BACKUP_FILE}"

# Upload to Google Drive (using gdrive CLI tool)
if command -v gdrive >/dev/null 2>&1; then
    echo "☁️  Uploading to Google Drive..."
    
    # Create backup folder if it doesn't exist
    GDRIVE_FOLDER_ID=$(gdrive list --query "name='time-management-backups' and mimeType='application/vnd.google-apps.folder'" --no-header | awk '{print $1}' | head -1)
    
    if [ -z "$GDRIVE_FOLDER_ID" ]; then
        echo "📁 Creating Google Drive backup folder..."
        GDRIVE_FOLDER_ID=$(gdrive mkdir time-management-backups | grep -o '[a-zA-Z0-9_-]\{28,\}')
    fi
    
    # Upload backup file
    gdrive upload "${BACKUP_FILE}" --parent "${GDRIVE_FOLDER_ID}"
    echo "✅ Backup uploaded to Google Drive"
else
    echo "⚠️  gdrive CLI not found - copying to local backup directory"
    cp "${BACKUP_FILE}" "${BACKUP_DIR}/"
fi

# Local retention cleanup
echo "🧹 Cleaning up old local backups (>${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "tasks-*.json" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "events-*.json" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Google Drive retention cleanup
if command -v gdrive >/dev/null 2>&1 && [ ! -z "$GDRIVE_FOLDER_ID" ]; then
    echo "🧹 Cleaning up old Google Drive backups (>${RETENTION_DAYS} days)..."
    
    # Get files older than retention period
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    
    # List and delete old backup files
    gdrive list --query "parents in '${GDRIVE_FOLDER_ID}' and name contains 'time-management-backup-' and createdTime < '${CUTOFF_DATE}T00:00:00'" --no-header | while read -r line; do
        FILE_ID=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $2}')
        if [ ! -z "$FILE_ID" ] && [ "$FILE_ID" != "Id" ]; then
            echo "🗑️  Deleting old backup: $FILE_NAME"
            gdrive delete "$FILE_ID" --skip-trash
        fi
    done
fi

# Cleanup temp files
rm -rf "${TEMP_BACKUP}"
rm -f "${BACKUP_FILE}"

echo "✅ Backup process completed successfully!"
echo "📊 Backup stats:"
du -sh "${BACKUP_DIR}" 2>/dev/null || echo "Local backup directory not accessible"

# Log backup completion
logger "time-management-app: Backup completed successfully to Google Drive"