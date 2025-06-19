# DigitalOcean Droplet Deployment Analysis

## Server Overview
- **Droplet IP**: 143.198.130.100  
- **OS**: Ubuntu 24.10 (GNU/Linux 6.11.0-26-generic x86_64)
- **Services**: Nginx, Node.js, SSL (Let's Encrypt)
- **Memory**: 44% usage
- **Disk**: 37.7% of 23.10GB used

## Current Deployments

### 1. berleinpsych.com (Static Site) - **DO NOT MODIFY**
- **Location**: `/var/www/lex-website-v2`
- **Repository**: `git@github.com:dan-slater/lex-website-v2.git`
- **Type**: Static HTML/CSS/JS site
- **Deployment**: GitHub Actions auto-deployment on push to main
- **Security**: HTTP Basic Auth protection (`/etc/nginx/.htpasswd_berlein`)
- **Nginx Config**:
  ```nginx
  server {
      listen 80;
      server_name berleinpsych.com www.berleinpsych.com;
      root /var/www/lex-website-v2;
      index index.html;
      auth_basic "Development Site - Access Required";
      auth_basic_user_file /etc/nginx/.htpasswd_berlein;
  }
  ```

### 2. cheersgifts.com (Go Application)
- **Repository**: `/root/cheers-gifts/`
- **Type**: Go application with Docker Compose
- **Port**: 8080 (proxied via nginx)
- **SSL**: Let's Encrypt certificates
- **Status**: Running via Docker

### 3. leachie.com (Node.js Application)
- **Port**: 3000 (proxied via nginx)
- **SSL**: Let's Encrypt certificates  
- **Security**: HTTP Basic Auth protection (`/etc/nginx/.htpasswd`)
- **Status**: Running

### 4. time-management-app (Our Target Application)
- **Location**: `/var/www/time-management-app`
- **Repository**: `https://github.com/dan-slater/time-management-app.git`
- **Access**: Direct IP access on `143.198.130.100`
- **Architecture**: Hybrid static + API
  - Frontend: Static files served by nginx
  - Backend: Node.js API server on port 3000
  - Data: File-based JSON storage

## time-management-app Current Deployment Details

### File Structure
```
/var/www/time-management-app/
├── index.html (frontend)
├── css/, js/, lib/ (static assets)
├── server.js (Node.js API server)
├── data/
│   ├── tasks.json (user tasks)
│   ├── events.json (event log)
│   └── snapshots/ (backups)
├── deploy.sh (deployment script)
├── docker-compose.production.yml
└── DEPLOYMENT.md
```

### Current Git Status
- **Latest commit**: `33c46dc Add deployment checklist for DigitalOcean setup`
- **Remote**: `https://github.com/dan-slater/time-management-app.git`
- **Branch**: main

### Running Processes
```bash
# Two Node.js processes running:
root   31000  node server.js (port 3001)
root   32058  node /var/www/time-management-app/server.js (port 3000)
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name 143.198.130.100;
    root /var/www/time-management-app;
    index index.html;
    
    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Serve static files
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Security headers and caching rules included
}
```

### Data Persistence
- **Tasks**: `/var/www/time-management-app/data/tasks.json` (305 bytes)
- **Events**: `/var/www/time-management-app/data/events.json` (2,284 bytes)
- **Backups**: `/var/www/time-management-app/data/snapshots/`
- **External Backup**: Hourly backups to `/var/backups/time-management/`

### API Status
- **Endpoint**: `http://143.198.130.100/api/tasks`
- **Status**: ✅ Functional (confirmed with curl test)
- **Response**: Returns existing task data in JSON format

## Docker Services Status
- **Docker**: Installed but no containers currently running
- **Docker Compose**: v1.29.2 available
- **Compose Files**: Found in `/root/cheers-gifts/` and various overlay directories

## Update Deployment Plan

### Prerequisites Check
- [x] Server access confirmed
- [x] Git repository accessible
- [x] Node.js server running and functional
- [x] Data persistence working
- [x] Nginx configuration correct

### Update Steps

1. **Backup Current Data**
   ```bash
   ssh root@berleinpsych.com '/usr/local/bin/backup-tasks'
   ```

2. **Stop Current Node.js Server**
   ```bash
   ssh root@berleinpsych.com 'kill 32058'
   ```

3. **Pull Latest Changes**
   ```bash
   ssh root@berleinpsych.com 'cd /var/www/time-management-app && git pull origin main'
   ```

4. **Install Dependencies** (if package.json changed)
   ```bash
   ssh root@berleinpsych.com 'cd /var/www/time-management-app && npm install'
   ```

5. **Set Permissions**
   ```bash
   ssh root@berleinpsych.com 'chown -R www-data:www-data /var/www/time-management-app'
   ```

6. **Restart Node.js Server**
   ```bash
   ssh root@berleinpsych.com 'cd /var/www/time-management-app && nohup node server.js > /dev/null 2>&1 &'
   ```

7. **Reload Nginx**
   ```bash
   ssh root@berleinpsych.com 'systemctl reload nginx'
   ```

8. **Verify Deployment**
   ```bash
   ssh root@berleinpsych.com 'curl -s localhost:3000/api/tasks | head -c 200'
   ```

### Rollback Plan
If deployment fails:
1. Restore from backup: `cp /var/backups/time-management/tasks-YYYYMMDD-HHMMSS.json /var/www/time-management-app/data/tasks.json`
2. Revert git: `cd /var/www/time-management-app && git reset --hard HEAD~1`
3. Restart server: `nohup node server.js > /dev/null 2>&1 &`

### Safety Considerations
- ✅ berleinpsych.com deployment isolated and protected
- ✅ Data backup system in place
- ✅ Process isolation (different ports for different apps)
- ✅ Nginx configuration prevents conflicts
- ✅ File permissions properly set

## Security Notes
- All applications use different ports (3000, 8080)
- SSL certificates managed by Let's Encrypt
- Basic auth protection on sensitive sites
- Firewall configured with UFW
- Regular security updates available (78 pending)

## Monitoring & Maintenance
- **Log Files**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **Backup Location**: `/var/backups/time-management/`
- **Update Script**: `/usr/local/bin/update-time-app`
- **Backup Script**: `/usr/local/bin/backup-tasks` (runs hourly)

---
*Analysis completed: 2025-06-19*
*Next update: Use this plan to safely deploy recent changes to time-management-app*