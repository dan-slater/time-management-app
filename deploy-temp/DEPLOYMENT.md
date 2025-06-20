# Digital Ocean Deployment Guide

This guide will help you deploy your Personal Time Management App to a Digital Ocean droplet.

## Prerequisites

- Digital Ocean account with a droplet running Ubuntu 20.04+ 
- Domain name pointed to your droplet's IP address
- SSH access to your droplet

## Step 1: Initial Server Setup

SSH into your Digital Ocean droplet:

```bash
ssh root@your-droplet-ip
```

Update the system:

```bash
apt update && apt upgrade -y
```

Install required packages:

```bash
apt install -y nginx git nodejs npm certbot python3-certbot-nginx ufw
```

## Step 2: Clone and Setup the Application

Navigate to web directory:

```bash
cd /var/www
```

Clone your repository:

```bash
git clone https://github.com/yourusername/time-management-app.git
cd time-management-app
```

Set proper permissions:

```bash
chown -R www-data:www-data /var/www/time-management-app
chmod -R 755 /var/www/time-management-app
```

## Step 3: Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/time-management-app
```

Add this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/time-management-app;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    location / {
        try_files $uri $uri/ =404;
        
        # Add security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle JSON data files
    location ~* \.json$ {
        add_header Content-Type application/json;
        expires 1h;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/time-management-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 4: Configure Firewall

Set up UFW firewall:

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
```

## Step 5: SSL Certificate (Optional but Recommended)

Get a free SSL certificate from Let's Encrypt:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 6: Setup Auto-Updates (Optional)

Create a deployment script for easy updates:

```bash
nano /usr/local/bin/update-time-app
```

Add this content:

```bash
#!/bin/bash
cd /var/www/time-management-app
git pull origin main
chown -R www-data:www-data /var/www/time-management-app
systemctl reload nginx
echo "Time Management App updated successfully!"
```

Make it executable:

```bash
chmod +x /usr/local/bin/update-time-app
```

## Step 7: Backup Strategy

Create a simple backup script:

```bash
nano /usr/local/bin/backup-tasks
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/time-management"
mkdir -p $BACKUP_DIR
cp /var/www/time-management-app/data/tasks.json $BACKUP_DIR/tasks-$(date +%Y%m%d-%H%M%S).json
# Keep only last 30 backups
ls -t $BACKUP_DIR/tasks-*.json | tail -n +31 | xargs -r rm
```

Make executable and add to crontab:

```bash
chmod +x /usr/local/bin/backup-tasks
crontab -e
```

Add this line to backup tasks every hour:

```
0 * * * * /usr/local/bin/backup-tasks
```

## Step 8: Test Your Deployment

1. Visit your domain in a browser
2. Test adding/completing tasks
3. Verify data persistence
4. Test mobile responsiveness

## Troubleshooting

### Check Nginx status:
```bash
systemctl status nginx
nginx -t
```

### Check Nginx logs:
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### File permissions issues:
```bash
chown -R www-data:www-data /var/www/time-management-app
chmod -R 755 /var/www/time-management-app
```

### Update application:
```bash
/usr/local/bin/update-time-app
```

## Security Notes

- Regularly update your server: `apt update && apt upgrade`
- Monitor access logs for unusual activity
- Consider setting up fail2ban for additional security
- Keep your Git repository private if it contains sensitive data
- Regular backups are stored in `/var/backups/time-management/`

## Production Considerations

- Consider using a process manager like PM2 if you add server-side features
- Set up monitoring with tools like Uptime Robot
- Consider implementing rate limiting for production use
- Add database integration for larger scale usage

Your time management app should now be live at your domain!