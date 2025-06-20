# SSH Authentication Troubleshooting for CI/CD

## Current Issue
The CI/CD pipeline is failing with SSH authentication errors:
```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

## Root Cause Analysis
The `appleboy/ssh-action` is having trouble parsing the SSH private key from the GitHub secret `DO_SSH_KEY`.

## Common Causes & Solutions

### 1. SSH Key Format Issues

**Problem**: The private key in GitHub secrets may be missing headers/footers or have incorrect formatting.

**Solution**: Ensure the complete private key is copied, including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[key content]
-----END OPENSSH PRIVATE KEY-----
```

**To get the correct format**:
```bash
# Copy the ENTIRE output including headers
cat ~/.ssh/id_rsa

# Or if using a different key:
cat ~/.ssh/id_ed25519
```

### 2. Line Ending Issues

**Problem**: GitHub secrets may strip line endings from the SSH key.

**Solution**: When pasting the key into GitHub secrets, ensure it preserves line breaks. The key should look like this in the secret:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEA...
[multiple lines of key content]
...AAAEC+8Q==
-----END OPENSSH PRIVATE KEY-----
```

### 3. Key Type Compatibility

**Problem**: Some older key formats may not be compatible.

**Solution**: Generate a new OpenSSH format key if needed:
```bash
# Generate new key in OpenSSH format
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_github -C "github-actions"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_rsa_github.pub root@143.198.130.100

# Use the private key content in GitHub secret
cat ~/.ssh/id_rsa_github
```

## Immediate Fix Options

### Option 1: Re-add the SSH Key Secret
1. On your local machine, run:
   ```bash
   cat ~/.ssh/id_rsa
   ```
2. Copy the ENTIRE output (including `-----BEGIN` and `-----END` lines)
3. Go to GitHub repository → Settings → Secrets and variables → Actions
4. Edit the `DO_SSH_KEY` secret
5. Paste the complete key content
6. Save and test

### Option 2: Alternative SSH Action
If the current action continues to fail, we can switch to a different SSH action that handles keys better.

### Option 3: Manual Testing
Test SSH connectivity manually:
```bash
# Test from your local machine
ssh -i ~/.ssh/id_rsa root@143.198.130.100 "echo 'SSH connection successful'"
```

## Current Secret Values
Based on the setup, your secrets should be:
- `DO_HOST`: `143.198.130.100`
- `DO_USERNAME`: `root` 
- `DO_SSH_KEY`: [Your complete private key content]
- `DO_PORT`: `22`

## Next Steps
1. Verify SSH key format in GitHub secrets
2. Test manual SSH connection
3. Re-trigger pipeline deployment
4. If still failing, implement alternative SSH action