# DigitalOcean Deployment Guide

## 🚨 CRITICAL: Data Persistence Setup

Your app will **lose all data on every deployment** unless you follow these steps!

## Step 1: Create a DigitalOcean Volume

1. **Log into DigitalOcean Dashboard**
2. **Go to Volumes** (in the sidebar)
3. **Create Volume:**
   - Name: `time-management-data`
   - Size: `10 GB` (more than enough)
   - Region: Same as your droplet
4. **Attach to your droplet**

## Step 2: Mount the Volume on Your Droplet

SSH into your droplet and run:

```bash
# Create mount point
sudo mkdir -p /mnt/time-management-data

# Mount the volume (replace /dev/disk/by-id/... with your volume's path)
sudo mount -o discard,defaults,noatime /dev/disk/by-id/scsi-0DO_Volume_time-management-data /mnt/time-management-data

# Make it persist across reboots
echo '/dev/disk/by-id/scsi-0DO_Volume_time-management-data /mnt/time-management-data ext4 defaults,nofail,discard 0 0' | sudo tee -a /etc/fstab

# Set proper ownership
sudo chown -R $USER:$USER /mnt/time-management-data
chmod 755 /mnt/time-management-data
```

## Step 3: Set Environment Variable

Add this to your deployment configuration:

```bash
export DATA_PATH="/mnt/time-management-data"
```

### For App Platform:
1. Go to your app in DigitalOcean App Platform
2. Go to **Settings** → **Environment Variables**
3. Add:
   - Key: `DATA_PATH`
   - Value: `/mnt/time-management-data`

### For Droplet:
Add to your `.bashrc` or deployment script:
```bash
echo 'export DATA_PATH="/mnt/time-management-data"' >> ~/.bashrc
source ~/.bashrc
```

## Step 4: Deploy Your App

Now when you deploy:

```bash
git push origin main
# → Your code updates
# → Your data persists! ✅
```

## Step 5: Verify It's Working

After deployment, check your app's health endpoint:

```bash
curl https://your-app.com/health
```

You should see:
```json
{
  "status": "healthy",
  "dataDir": "/mnt/time-management-data/data",
  "tasksCount": 5,
  "eventsCount": 23
}
```

And in your app logs:
```
✅ Using persistent storage: /mnt/time-management-data
```

## File Structure on Volume

Your volume will contain:
```
/mnt/time-management-data/
└── data/
    ├── tasks.json          # Your tasks
    ├── events.json         # Activity history
    ├── schema.json         # Data structure
    └── snapshots/          # Daily backups
        └── snapshot_2024-06-18_abc123.json
```

## Backup Strategy

### Automatic Backups
- **Daily snapshots** are created automatically
- **DigitalOcean Volume snapshots** (manual or scheduled)

### Manual Backup
```bash
# Backup your entire data
sudo tar -czf time-management-backup-$(date +%Y%m%d).tar.gz -C /mnt/time-management-data .

# Download to your local machine
scp user@your-droplet:~/time-management-backup-*.tar.gz ./
```

## Troubleshooting

### Data Not Persisting?
Check these:

1. **Volume mounted correctly?**
   ```bash
   df -h | grep time-management-data
   ```

2. **Environment variable set?**
   ```bash
   echo $DATA_PATH
   # Should output: /mnt/time-management-data
   ```

3. **App using correct path?**
   ```bash
   curl your-app.com/health | jq .dataDir
   # Should output: "/mnt/time-management-data/data"
   ```

4. **Permissions correct?**
   ```bash
   ls -la /mnt/time-management-data/
   # Should be owned by your user, not root
   ```

### App Not Starting?
Check logs for:
```
⚠️ Using local storage - data will be lost on deployment!
```

This means `DATA_PATH` environment variable isn't set.

## Migration from Local to Volume

If you already have local data you want to preserve:

```bash
# Copy existing data to volume
sudo cp -r /path/to/your/local/data/* /mnt/time-management-data/data/

# Set permissions
sudo chown -R $USER:$USER /mnt/time-management-data/data/
```

## Cost Considerations

- **10GB Volume**: ~$1/month
- **Volume snapshots**: ~$0.05/GB/month
- **Total cost**: ~$1-2/month for persistent storage

Much cheaper than a managed database and perfect for personal use!

## Next Steps

Once this is working, you can:
1. **Schedule volume snapshots** in DigitalOcean dashboard
2. **Monitor storage usage** (you'll likely never exceed 1GB)
3. **Export your data** anytime via `/api/history/export`

Your productivity data is now safe across all deployments! 🎉