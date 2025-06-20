#!/bin/bash

# Cleanup Old Backups Script
# Removes local backup files older than specified retention period

set -e

BACKUP_DIR="/var/backups/time-management"
APP_BACKUP_DIR="/var/www"
RETENTION_DAYS=30
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --retention-days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--retention-days DAYS] [--dry-run]"
            echo "  --retention-days: Number of days to keep backups (default: 30)"
            echo "  --dry-run: Show what would be deleted without actually deleting"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🧹 Cleanup starting..."
echo "📅 Retention period: ${RETENTION_DAYS} days"
echo "📁 Backup directory: ${BACKUP_DIR}"

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN MODE - No files will be deleted"
fi

# Function to clean up files
cleanup_files() {
    local directory="$1"
    local pattern="$2"
    local description="$3"
    
    if [ ! -d "$directory" ]; then
        echo "⚠️  Directory not found: $directory"
        return
    fi
    
    echo "🔍 Checking $description in $directory..."
    
    # Find files older than retention period
    local old_files
    old_files=$(find "$directory" -name "$pattern" -mtime +${RETENTION_DAYS} 2>/dev/null || true)
    
    if [ -z "$old_files" ]; then
        echo "✅ No old $description found"
        return
    fi
    
    local file_count
    file_count=$(echo "$old_files" | wc -l)
    
    echo "📋 Found $file_count old $description files:"
    echo "$old_files" | while read -r file; do
        if [ -n "$file" ]; then
            local file_age
            file_age=$(find "$file" -mtime +${RETENTION_DAYS} -printf "%TY-%Tm-%Td\n" 2>/dev/null || echo "unknown")
            local file_size
            file_size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "?")
            echo "  🗑️  $file (${file_size}, modified: ${file_age})"
        fi
    done
    
    if [ "$DRY_RUN" = false ]; then
        echo "$old_files" | while read -r file; do
            if [ -n "$file" ] && [ -f "$file" ]; then
                rm "$file" && echo "🗑️  Deleted: $(basename "$file")"
            fi
        done
        echo "✅ Cleaned up $file_count old $description files"
    fi
}

# Clean up data backups
cleanup_files "$BACKUP_DIR" "tasks-*.json" "task backup"
cleanup_files "$BACKUP_DIR" "events-*.json" "events backup"
cleanup_files "$BACKUP_DIR" "*.tar.gz" "compressed backup"

# Clean up application code backups
cleanup_files "$APP_BACKUP_DIR" "time-management-app-backup-*" "application backup"

# Clean up old snapshots in data directory (if accessible)
DATA_SNAPSHOTS="/mnt/time-management-data/data/snapshots"
if [ -d "$DATA_SNAPSHOTS" ]; then
    cleanup_files "$DATA_SNAPSHOTS" "snapshot_*.json" "data snapshot"
fi

# Show summary
echo ""
echo "📊 Cleanup Summary:"
echo "🗂️  Directories checked:"
echo "   - $BACKUP_DIR"
echo "   - $APP_BACKUP_DIR" 
echo "   - $DATA_SNAPSHOTS"
echo "📅 Retention period: $RETENTION_DAYS days"

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN COMPLETED - No files were deleted"
    echo "💡 Run without --dry-run to actually delete files"
else
    echo "✅ CLEANUP COMPLETED"
fi

# Show current backup space usage
echo ""
echo "💾 Current backup space usage:"
if [ -d "$BACKUP_DIR" ]; then
    du -sh "$BACKUP_DIR" 2>/dev/null || echo "   $BACKUP_DIR: Unable to calculate"
fi

if [ -d "$DATA_SNAPSHOTS" ]; then
    du -sh "$DATA_SNAPSHOTS" 2>/dev/null || echo "   $DATA_SNAPSHOTS: Unable to calculate"
fi

# Log completion
logger "time-management-app: Backup cleanup completed (retention: ${RETENTION_DAYS} days, dry-run: ${DRY_RUN})"