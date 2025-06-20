# GitHub Secrets Configuration Checklist

This checklist ensures all required secrets are properly configured for the CI/CD pipeline.

## Required Secrets for Deployment

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

### 🔑 DigitalOcean Connection Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DO_HOST` | Your droplet's IP address or domain | `143.198.123.45` or `myapp.example.com` |
| `DO_USERNAME` | SSH username (should be `deploy`) | `deploy` |
| `DO_SSH_KEY` | Private SSH key content | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `DO_PORT` | SSH port (usually 22) | `22` |
| `DO_DOMAIN` | Your domain name for nginx config | `timemanagement.yourdomain.com` |

### 📊 Optional Secrets for Enhanced Features

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `CODECOV_TOKEN` | For code coverage reporting | No |

## ✅ Pre-Deployment Checklist

### 1. Server Setup Complete
- [ ] DigitalOcean droplet created and configured
- [ ] Deploy user created with sudo privileges
- [ ] SSH key authentication configured
- [ ] Node.js, nginx, and PM2 installed
- [ ] Firewall configured (ports 22, 80, 443)

### 2. SSH Key Pair Generated
- [ ] SSH key pair generated on local machine
- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] Private key content copied to `DO_SSH_KEY` secret
- [ ] SSH connection tested manually

### 3. Domain Configuration
- [ ] Domain DNS pointed to droplet IP address
- [ ] Domain added to `DO_DOMAIN` secret
- [ ] SSL certificate configuration planned (optional)

### 4. GitHub Secrets Configured
- [ ] All required secrets added to repository
- [ ] Secret values tested and verified
- [ ] No trailing spaces or newlines in secret values

## 🧪 Testing Your Configuration

### 1. Test SSH Connection
```bash
# From your local machine
ssh -i ~/.ssh/your-key deploy@your-droplet-ip

# Should connect without password prompt
```

### 2. Test Domain Resolution
```bash
# Check if domain points to your droplet
nslookup your-domain.com

# Should return your droplet's IP address
```

### 3. Test GitHub Actions
- Create a small test commit and push to a feature branch
- Check if CI pipeline runs successfully
- Merge to master branch and verify deployment

## 🚨 Security Best Practices

### SSH Key Security
- [ ] Private key never shared or committed to repository
- [ ] SSH key has a strong passphrase (recommended)
- [ ] Public key added only to necessary servers
- [ ] Regular key rotation planned

### Server Security
- [ ] Root login disabled
- [ ] Password authentication disabled
- [ ] SSH key-only authentication enabled
- [ ] Firewall configured with minimal required ports
- [ ] Server regularly updated

### Secrets Management
- [ ] Secrets only accessible to authorized team members
- [ ] Regular audit of who has access to secrets
- [ ] Secrets rotated periodically
- [ ] No secrets in code or documentation

## 🔧 Troubleshooting Common Issues

### "Permission denied (publickey)" Error
1. Verify public key is in `~/.ssh/authorized_keys` on server
2. Check file permissions: `chmod 600 ~/.ssh/authorized_keys`
3. Ensure private key format is correct in GitHub secret
4. Test SSH connection manually

### "Host key verification failed" Error
1. Connect to server manually first to accept host key
2. Or add server to known_hosts in GitHub Action

### "Connection refused" Error
1. Check if SSH service is running: `sudo systemctl status ssh`
2. Verify port 22 is open in firewall
3. Check if droplet is running

### Deployment Fails at Application Start
1. Check PM2 logs: `pm2 logs time-management-app`
2. Verify Node.js version compatibility
3. Check if port 3000 is available
4. Ensure data directory has correct permissions

## 📞 Support Resources

- [DigitalOcean SSH Documentation](https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## ✅ Final Verification

After configuration is complete:

1. **CI Pipeline**: Push code and verify tests run
2. **Deployment**: Merge to master and verify app deploys
3. **Health Check**: Verify `http://your-domain.com/health` returns success
4. **Functionality**: Test task creation and data persistence
5. **Monitoring**: Set up monitoring/alerting for production app