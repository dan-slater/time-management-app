# DigitalOcean Deployment Setup

This document provides instructions for setting up automated deployment to DigitalOcean.

## Prerequisites

1. **DigitalOcean Droplet**: Create an Ubuntu 22.04 droplet
2. **Domain Name**: Point your domain to the droplet's IP address
3. **SSH Access**: Ensure you can SSH into your droplet

## Initial Server Setup

### 1. Connect to your droplet and update the system:
```bash
ssh root@your-droplet-ip
apt update && apt upgrade -y
```

### 2. Create a deployment user:
```bash
adduser deploy
usermod -aG sudo deploy
```

### 3. Install Node.js and required packages:
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs nginx

# Install PM2 globally
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
```

### 4. Setup SSH key authentication for deploy user:
```bash
# Switch to deploy user
su - deploy

# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key to authorized_keys
echo "your-public-key-here" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 5. Configure firewall:
```bash
# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## GitHub Secrets Configuration

Add the following secrets in your GitHub repository settings:

### Required Secrets:
- `DO_HOST`: Your droplet's IP address or domain
- `DO_USERNAME`: `deploy` (the user we created)
- `DO_SSH_KEY`: Your private SSH key content
- `DO_PORT`: `22` (default SSH port)
- `DO_DOMAIN`: Your domain name (e.g., `timemanagement.yourdomain.com`)

### Optional Secrets:
- `CODECOV_TOKEN`: For code coverage reporting (optional)

## SSH Key Generation

If you don't have an SSH key pair:

```bash
# Generate SSH key pair on your local machine
ssh-keygen -t ed25519 -C "deployment@github-actions"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@your-droplet-ip

# Add private key to GitHub secrets (DO_SSH_KEY)
cat ~/.ssh/id_ed25519
```

## Application Structure on Server

The deployment creates this structure:
```
/opt/time-management-app/     # Application files
/opt/time-management-data/    # Persistent data storage
    /data/                    # JSON data files
        tasks.json
        shopping.json
        events.json
        /snapshots/           # Daily backups
```

## Environment Variables

The following environment variables are automatically set:
- `NODE_ENV=production`
- `PORT=3000`
- `DATA_PATH=/opt/time-management-data`

## Nginx Configuration

The deployment automatically configures nginx as a reverse proxy:
- Application runs on `localhost:3000`
- Nginx proxies requests from port 80 to the application
- Static files are served efficiently

## SSL/HTTPS Setup (Optional)

After initial deployment, you can add SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is handled by certbot
```

## Monitoring and Logs

### PM2 Commands:
```bash
# Check application status
pm2 status

# View logs
pm2 logs time-management-app

# Restart application
pm2 restart time-management-app

# Monitor resources
pm2 monit
```

### Application Health Check:
```bash
curl http://localhost:3000/health
```

## Backup Strategy

- Daily snapshots are automatically created by the application
- Data is stored in `/opt/time-management-data` for persistence
- Deployment creates timestamped backups before updates

## Troubleshooting

### Check Application Status:
```bash
pm2 status
pm2 logs time-management-app
```

### Check Nginx Status:
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### Check Disk Space:
```bash
df -h
```

### Check Application Logs:
```bash
pm2 logs time-management-app --lines 100
```

## Security Considerations

1. **Firewall**: Only necessary ports are open
2. **User Isolation**: Application runs under dedicated user
3. **SSH Keys**: Password authentication disabled
4. **Data Backup**: Regular snapshots for data recovery
5. **Process Management**: PM2 ensures application availability

## Cost Optimization

- **Droplet Size**: Start with the $6/month basic droplet
- **Monitoring**: Use DigitalOcean monitoring to track usage
- **Backups**: Consider DigitalOcean backup service for complete disaster recovery

## Support

For deployment issues:
1. Check GitHub Actions logs
2. SSH into server and check PM2 logs
3. Verify nginx configuration
4. Check application health endpoint