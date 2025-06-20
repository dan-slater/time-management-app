# Complete Deployment Guide

This guide provides step-by-step instructions for deploying the Time Management App to DigitalOcean with automated CI/CD.

## Overview

The deployment setup includes:
- **GitHub Actions CI/CD**: Automated testing and deployment
- **DigitalOcean Droplet**: Ubuntu 22.04 server
- **PM2**: Process management and zero-downtime deployment
- **Nginx**: Reverse proxy and static file serving
- **Persistent Storage**: Data survives deployments

## 📋 Prerequisites

- GitHub repository with the Time Management App
- DigitalOcean account
- Domain name (optional but recommended)
- Local machine with SSH client

## 🚀 Step 1: Create DigitalOcean Droplet

1. **Create Droplet**:
   - Choose Ubuntu 22.04 LTS
   - Select appropriate size ($6/month Basic Droplet is sufficient to start)
   - Choose a region close to your users
   - Add SSH key (create one if you don't have it)

2. **Note Important Information**:
   - Droplet IP address
   - SSH key location on your machine

## 🔧 Step 2: Server Initial Setup

### Connect to Your Server
```bash
ssh root@YOUR_DROPLET_IP
```

### Update System
```bash
apt update && apt upgrade -y
```

### Create Deploy User
```bash
# Create user with sudo privileges
adduser deploy
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

### Setup SSH Key Authentication
```bash
# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (replace with your actual public key)
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGr..." > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Install Required Software
```bash
# Exit to root user
exit

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install nginx
apt-get install -y nginx

# Install PM2 globally
npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u deploy --hp /home/deploy
# Follow the instructions shown after running this command
```

### Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Create Application Directories
```bash
# Create app directory
sudo mkdir -p /opt/time-management-app
sudo chown deploy:deploy /opt/time-management-app

# Create persistent data directory
sudo mkdir -p /opt/time-management-data
sudo chown deploy:deploy /opt/time-management-data
```

## 🔑 Step 3: Generate SSH Keys for CI/CD

On your local machine:

```bash
# Generate SSH key pair for deployment
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions-deploy"

# Copy public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@YOUR_DROPLET_IP

# Test connection
ssh -i ~/.ssh/deploy_key deploy@YOUR_DROPLET_IP
```

## 🎯 Step 4: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `DO_HOST` | Your droplet IP or domain | `143.198.123.45` |
| `DO_USERNAME` | `deploy` | `deploy` |
| `DO_SSH_KEY` | Contents of your private key | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `DO_PORT` | `22` | `22` |
| `DO_DOMAIN` | Your domain name | `timeapp.yourdomain.com` |

To get the private key content:
```bash
cat ~/.ssh/deploy_key
```

Copy the entire output including the header and footer lines.

## 🌐 Step 5: Domain Configuration (Optional)

If you have a domain:

1. **Configure DNS**:
   - Create an A record pointing to your droplet IP
   - Wait for DNS propagation (5-60 minutes)

2. **Verify DNS**:
   ```bash
   nslookup yourdomain.com
   ```

## 🚀 Step 6: Test Deployment

### Manual Test
1. Push a small change to a feature branch
2. Check that CI pipeline runs successfully
3. Create a pull request
4. Verify tests pass

### Deployment Test
1. Merge the PR to master branch
2. Watch GitHub Actions for deployment progress
3. Check deployment success:
   ```bash
   curl http://YOUR_DROPLET_IP/health
   # Should return: {"status":"healthy",...}
   ```

## 🔒 Step 7: SSL Setup (Recommended)

After successful deployment:

```bash
# SSH into your server
ssh deploy@YOUR_DROPLET_IP

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 📊 Step 8: Monitoring Setup

### PM2 Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs time-management-app

# Monitor in real-time
pm2 monit
```

### Set up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Permission denied (publickey)" Error
```bash
# Check SSH key format
ssh -i ~/.ssh/deploy_key -v deploy@YOUR_DROPLET_IP

# Verify public key on server
cat ~/.ssh/authorized_keys
```

#### 2. Application Won't Start
```bash
# Check PM2 logs
pm2 logs time-management-app

# Check if port is available
sudo lsof -i :3000

# Restart application
pm2 restart time-management-app
```

#### 3. Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. Deployment Fails
- Check GitHub Actions logs for specific error
- Verify all secrets are correctly configured
- Ensure server has enough disk space: `df -h`
- Check server connectivity from GitHub Actions

### Emergency Procedures

#### Rollback Deployment
```bash
# SSH to server
ssh deploy@YOUR_DROPLET_IP

# Stop current app
pm2 stop time-management-app

# Restore from backup (if available)
cd /opt/time-management-app
# Restore previous version manually

# Start app
pm2 start time-management-app
```

#### Data Recovery
```bash
# Data is stored in /opt/time-management-data
# Daily snapshots are in /opt/time-management-data/data/snapshots
ls -la /opt/time-management-data/data/snapshots/

# Restore from snapshot if needed
cp /opt/time-management-data/data/snapshots/snapshot_YYYY-MM-DD_*.json /opt/time-management-data/data/
```

## 📈 Performance Optimization

### Server Optimization
```bash
# Increase file descriptor limits
echo "deploy soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "deploy hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize PM2 for production
pm2 set pm2:autodump true
pm2 set pm2:watch false
```

### Nginx Optimization
Create `/etc/nginx/sites-available/time-management-app-optimized`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static file caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🎉 Success Verification

After completing all steps:

1. **Application Health**: `curl http://yourdomain.com/health`
2. **SSL Certificate**: `curl https://yourdomain.com/health`
3. **Task Creation**: Test creating and managing tasks
4. **Data Persistence**: Verify data survives server restart
5. **CI/CD Pipeline**: Test with a code change

## 📞 Support

- **Server Issues**: Check PM2 logs and nginx status
- **Deployment Issues**: Review GitHub Actions logs
- **Application Issues**: Check application health endpoint
- **Data Issues**: Verify data directory permissions and snapshots

Your Time Management App should now be successfully deployed with automated CI/CD! 🎉