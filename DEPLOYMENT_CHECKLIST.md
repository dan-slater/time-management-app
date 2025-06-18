# 🚀 DigitalOcean Deployment Checklist

## ✅ **Step 1: Code is Ready** 
- [x] Features implemented
- [x] Changes committed to Git  
- [x] Code pushed to GitHub

## 📋 **Step 2: DigitalOcean Volume Setup**

### 2.1 Create Volume
1. **Log into DigitalOcean Dashboard**
2. **Navigate to**: Volumes (left sidebar)
3. **Click**: "Create Volume"
4. **Configure**:
   - Name: `time-management-data`
   - Size: `10 GB` 
   - Region: Same as your droplet
   - Filesystem: `ext4`
5. **Click**: "Create Volume"
6. **Attach**: to your existing droplet

### 2.2 Mount Volume on Droplet
SSH into your droplet and run:

```bash
# Find your volume device
sudo fdisk -l | grep "10 GiB"
# Should show something like: /dev/sda or /dev/disk/by-id/scsi-0DO_Volume_time_management_data

# Create mount point
sudo mkdir -p /mnt/time-management-data

# Mount the volume (replace DEVICE_PATH with your actual path)
sudo mount -o discard,defaults,noatime /dev/disk/by-id/scsi-0DO_Volume_time_management_data /mnt/time-management-data

# Make it permanent (survive reboots)
echo '/dev/disk/by-id/scsi-0DO_Volume_time_management_data /mnt/time-management-data ext4 defaults,nofail,discard 0 0' | sudo tee -a /etc/fstab

# Set ownership
sudo chown -R $USER:$USER /mnt/time-management-data
chmod 755 /mnt/time-management-data

# Verify it worked
df -h | grep time-management-data
```

## 🔧 **Step 3: Configure Environment**

### 3.1 Set Environment Variable
Add to your deployment configuration:

**For App Platform:**
1. Go to your app → Settings → Environment Variables
2. Add: `DATA_PATH` = `/mnt/time-management-data`

**For Droplet/Docker:**
```bash
echo 'export DATA_PATH="/mnt/time-management-data"' >> ~/.bashrc
source ~/.bashrc
```

### 3.2 Update Your Deployment Process
Make sure your deployment pulls the latest code:

```bash
# SSH into droplet
ssh user@your-droplet-ip

# Navigate to your app directory
cd /path/to/your/app

# Pull latest changes
git pull origin master

# Restart your app (method depends on your setup)
# Option 1: PM2
pm2 restart time-management-app

# Option 2: Docker
docker-compose down && docker-compose up -d

# Option 3: Systemd
sudo systemctl restart your-app-name
```

## 🧪 **Step 4: Test Deployment**

### 4.1 Check Health Endpoint
```bash
curl https://your-app-domain.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "dataDir": "/mnt/time-management-data/data",
  "tasksCount": 0,
  "eventsCount": 1
}
```

### 4.2 Check App Logs
Look for this message:
```
✅ Using persistent storage: /mnt/time-management-data
```

**Not this:**
```
⚠️ Using local storage - data will be lost on deployment!
```

### 4.3 Test Data Persistence
1. **Create a task** via the web interface
2. **Restart your app**
3. **Verify task is still there**

### 4.4 Check File System
```bash
ls -la /mnt/time-management-data/data/
# Should show: tasks.json, events.json, snapshots/
```

## 🎉 **Step 5: Verify Everything Works**

### 5.1 Test Features
- [ ] Create tasks
- [ ] Mark tasks complete
- [ ] Toggle dark mode (should persist)
- [ ] Check analytics: `https://your-app.com/api/history/analytics`
- [ ] Export data: `https://your-app.com/api/history/export`

### 5.2 Test Deployment Persistence
- [ ] Deploy a small code change
- [ ] Verify your tasks are still there
- [ ] Check historical events are preserved

## 🔧 **Troubleshooting**

### Volume Not Mounted?
```bash
# Check if volume is attached
sudo fdisk -l

# Check mount status
df -h | grep time-management-data

# Re-mount if needed
sudo mount /mnt/time-management-data
```

### Environment Variable Not Set?
```bash
# Check current value
echo $DATA_PATH

# Check app is using it
curl your-app.com/health | jq .dataDir
```

### App Still Using Local Storage?
Check your app's startup logs for the warning message. If you see:
```
⚠️ Using local storage - data will be lost on deployment!
```

Then the `DATA_PATH` environment variable isn't being read by your app.

## 🎯 **Success Criteria**

Your deployment is successful when:
- [x] ✅ Health endpoint shows persistent data directory
- [x] ✅ App logs show "Using persistent storage"
- [x] ✅ Tasks survive app restarts
- [x] ✅ Dark mode preference persists
- [x] ✅ Historical events are being logged
- [x] ✅ Daily snapshots are being created

**Congratulations!** Your time management app now has bulletproof data persistence! 🎉📊