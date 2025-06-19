# GitHub Secrets Setup for CI/CD

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

## How to Add Secrets

1. Go to your repository on GitHub: `https://github.com/dan-slater/time-management-app`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** for each secret below

## Required Secrets

### `DO_HOST`
- **Value**: `143.198.130.100` (or `leachie.com`)
- **Description**: The hostname or IP address of your DigitalOcean droplet
- **Note**: Use the IP address for SSH access, since leachie.com has HTTP auth protection

### `DO_USERNAME` 
- **Value**: `root`
- **Description**: SSH username for your droplet

### `DO_SSH_KEY`
- **Value**: Your private SSH key content
- **Description**: The private SSH key that allows access to your droplet
- **How to get**: Run this command on your local machine and copy the output:
  ```bash
  cat ~/.ssh/id_rsa
  ```
  Or if you use a different key name:
  ```bash
  cat ~/.ssh/your_key_name
  ```

### `DO_PORT`
- **Value**: `22`
- **Description**: SSH port (usually 22)

## Optional Secrets

### `CODECOV_TOKEN`
- **Value**: Your Codecov token (if you want test coverage reports)
- **Description**: For uploading test coverage data to Codecov
- **Required**: No (the pipeline will skip this if not provided)

## Verification

After adding all secrets, you can verify they're set up correctly by:

1. Going to **Settings** → **Secrets and variables** → **Actions**
2. You should see all 4 required secrets listed
3. The values will be hidden for security

## Testing the Pipeline

Once secrets are configured:

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Go to the **Actions** tab in your GitHub repository
4. Watch the pipeline run and deploy automatically

## Security Notes

- Never commit SSH keys or passwords to your repository
- The secrets are encrypted and only visible to GitHub Actions
- If you suspect a key has been compromised, regenerate it and update the secret

## Pipeline Features

The updated CI/CD pipeline will:

✅ **Backup your data** before deployment  
✅ **Preserve production tasks** from `/mnt/time-management-data/`  
✅ **Deploy new code** while keeping your data safe  
✅ **Restart the Node.js server** automatically  
✅ **Reload nginx** to ensure proper routing  
✅ **Health check** both frontend and API  
✅ **Rollback capability** via backups if needed  

## Manual Rollback (If Needed)

If a deployment fails, you can rollback manually:

```bash
ssh root@berleinpsych.com
cd /var/www
sudo rm -rf time-management-app
sudo mv time-management-app-backup-YYYYMMDD-HHMMSS time-management-app
sudo chown -R www-data:www-data time-management-app
cd time-management-app
sudo -u www-data nohup node server.js > /dev/null 2>&1 &
```