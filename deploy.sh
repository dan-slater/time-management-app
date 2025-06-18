#!/bin/bash

# Digital Ocean Deployment Script for Time Management App
# Run this script on your Digital Ocean droplet

set -e

echo "🚀 Starting deployment of Time Management App..."

# Configuration
DOMAIN=${1:-"yourdomain.com"}
APP_DIR="/var/www/time-management-app"
NGINX_CONF="/etc/nginx/sites-available/time-management-app"
BACKUP_DIR="/var/backups/time-management"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

echo "📦 Installing required packages..."
apt update
apt install -y nginx git nodejs npm certbot python3-certbot-nginx ufw

echo "📁 Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "📥 Cloning repository..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    echo "Cloning fresh repository..."
    git clone https://github.com/dan-slater/time-management-app.git .
fi

echo "🔐 Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo "🌐 Configuring Nginx..."
cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Handle JSON data files
    location ~* \.json\$ {
        add_header Content-Type application/json;
        expires 1h;
        add_header Cache-Control "no-cache, must-revalidate";
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🧪 Testing Nginx configuration..."
nginx -t
systemctl reload nginx

echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "💾 Setting up backup system..."
mkdir -p $BACKUP_DIR

cat > /usr/local/bin/backup-tasks << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/time-management"
mkdir -p $BACKUP_DIR
if [ -f "/var/www/time-management-app/data/tasks.json" ]; then
    cp /var/www/time-management-app/data/tasks.json $BACKUP_DIR/tasks-$(date +%Y%m%d-%H%M%S).json
    # Keep only last 30 backups
    ls -t $BACKUP_DIR/tasks-*.json | tail -n +31 | xargs -r rm
fi
EOF

chmod +x /usr/local/bin/backup-tasks

# Add hourly backup cron job
(crontab -l 2>/dev/null; echo "0 * * * * /usr/local/bin/backup-tasks") | crontab -

echo "🔄 Setting up update script..."
cat > /usr/local/bin/update-time-app << EOF
#!/bin/bash
cd $APP_DIR
git pull origin main
chown -R www-data:www-data $APP_DIR
systemctl reload nginx
echo "✅ Time Management App updated successfully!"
EOF

chmod +x /usr/local/bin/update-time-app

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Update your DNS to point $DOMAIN to this server's IP"
echo "   2. Test your app at http://$DOMAIN"
echo "   3. Get SSL certificate: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   4. Update app anytime with: /usr/local/bin/update-time-app"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: tail -f /var/log/nginx/error.log"
echo "   - Restart nginx: systemctl restart nginx"
echo "   - Check status: systemctl status nginx"
echo ""