# Google Drive Backup Setup

This guide explains how to set up automatic Google Drive backups for your Time Management App.

## Overview

The backup system will:
- ☁️ **Upload backups to Google Drive** on every deployment
- 📦 **Create comprehensive backup packages** (tasks, events, shopping, snapshots)
- 🧹 **Automatically clean up old backups** (30-day retention)
- 🔒 **Secure authentication** using Google Service Account

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Drive API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in service account details:
   - **Name**: `time-management-backup`
   - **Description**: `Service account for automated backups`
4. Skip role assignment (we'll set Drive permissions directly)
5. Click "Done"

## Step 3: Generate Service Account Key

1. Find your service account in the credentials list
2. Click on the service account name
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Select **JSON** format
6. Download the key file (keep it secure!)

## Step 4: Share Google Drive Folder

1. Create a folder in your Google Drive called `time-management-backups`
2. Right-click the folder → "Share"
3. Add the service account email (from the JSON file) as "Editor"
4. The email looks like: `time-management-backup@your-project.iam.gserviceaccount.com`

## Step 5: Install on Server

SSH into your droplet and set up the backup system:

```bash
# Install required Python packages
sudo apt update
sudo apt install python3-pip
sudo pip3 install google-api-python-client google-auth

# Upload service account key
sudo mkdir -p /var/www/time-management-app
# Copy your downloaded JSON file to: /var/www/time-management-app/google-service-account.json
sudo chown www-data:www-data /var/www/time-management-app/google-service-account.json
sudo chmod 600 /var/www/time-management-app/google-service-account.json
```

## Step 6: Test Backup

Test the backup system manually:

```bash
cd /var/www/time-management-app
sudo python3 scripts/gdrive-backup.py google-service-account.json
```

Expected output:
```
✅ Google Drive API initialized
📦 Creating backup package...
📁 Backup created: /tmp/time-management-backup-20250620-101234.tar.gz (45KB)
📁 Using existing backup folder: 1a2b3c4d5e6f...
☁️  Uploading to Google Drive...
✅ Uploaded: time-management-backup-20250620-101234.tar.gz (45KB)
✅ No old backups to clean up
✅ Backup process completed!
```

## Step 7: Verify in Google Drive

1. Check your Google Drive
2. Look for `time-management-backups` folder
3. Verify backup files are being uploaded

## Backup Schedule

**Automatic Backups occur:**
- ✅ Every CI/CD deployment (when code is pushed)
- ✅ Before any application updates
- ✅ Retention: 30 days (configurable)

**Manual Backups:**
```bash
# Create immediate backup
curl -X POST https://leachie.com/api/history/snapshots \
  -H "Content-Type: application/json" \
  -d '{"reason": "manual backup"}' \
  -u dandan:420
```

## Backup Contents

Each backup includes:
- 📝 `tasks.json` - All your tasks
- 📊 `events.json` - Complete activity history  
- 🛒 `shopping.json` - Shopping list data
- 📸 `snapshots/` - Daily automatic snapshots
- ℹ️ `backup-info.json` - Backup metadata

## Security Notes

- 🔐 Service account key is stored securely on server
- 🚫 Never commit the JSON key file to git
- 🔒 Service account has minimal permissions (Drive access only)
- 📋 Backups are compressed and include metadata for verification

## Troubleshooting

**"Google Drive API not available"**
```bash
sudo pip3 install google-api-python-client google-auth
```

**"Could not initialize Google Drive API"**
- Check service account JSON file exists and has correct permissions
- Verify Google Drive API is enabled in your project

**"Upload failed"**
- Ensure service account email has access to the backup folder
- Check internet connectivity from server

## Monitoring

Check backup logs:
```bash
# Recent backup activity
tail -f /var/log/syslog | grep time-management-app

# Manual backup test
sudo python3 /var/www/time-management-app/scripts/gdrive-backup.py \
  /var/www/time-management-app/google-service-account.json
```