#!/usr/bin/env python3
"""
Google Drive Backup Script for Time Management App
Uploads backup files to Google Drive and manages retention
"""

import os
import json
import tarfile
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path

try:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from google.oauth2.service_account import Credentials
    GDRIVE_AVAILABLE = True
except ImportError:
    GDRIVE_AVAILABLE = False
    print("⚠️  Google Drive API not available - install google-api-python-client")

class GDriveBackup:
    def __init__(self, service_account_file=None):
        self.service = None
        self.backup_folder_id = None
        self.retention_days = 30
        
        if GDRIVE_AVAILABLE and service_account_file and os.path.exists(service_account_file):
            try:
                credentials = Credentials.from_service_account_file(
                    service_account_file,
                    scopes=['https://www.googleapis.com/auth/drive']
                )
                self.service = build('drive', 'v3', credentials=credentials)
                print("✅ Google Drive API initialized")
            except Exception as e:
                print(f"⚠️  Could not initialize Google Drive API: {e}")

    def create_backup_package(self, data_dir="/mnt/time-management-data/data"):
        """Create comprehensive backup package"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_name = f"time-management-backup-{timestamp}"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            backup_path = Path(temp_dir) / backup_name
            backup_path.mkdir()
            
            print("📦 Creating backup package...")
            
            # Copy data files
            data_path = Path(data_dir)
            files_copied = []
            
            for file_name in ['tasks.json', 'events.json', 'shopping.json']:
                src_file = data_path / file_name
                if src_file.exists():
                    shutil.copy2(src_file, backup_path / file_name)
                    files_copied.append(file_name)
                else:
                    # Create empty file for missing data
                    (backup_path / file_name).write_text('[]')
                    files_copied.append(f"{file_name} (empty)")
            
            # Copy snapshots directory
            snapshots_src = data_path / "snapshots"
            if snapshots_src.exists():
                shutil.copytree(snapshots_src, backup_path / "snapshots")
                files_copied.append("snapshots/")
            else:
                (backup_path / "snapshots").mkdir()
                files_copied.append("snapshots/ (empty)")
            
            # Create backup metadata
            backup_info = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "hostname": os.uname().nodename,
                "backup_type": "deployment",
                "files_included": files_copied,
                "retention_days": self.retention_days,
                "data_directory": str(data_dir)
            }
            
            (backup_path / "backup-info.json").write_text(
                json.dumps(backup_info, indent=2)
            )
            
            # Create compressed archive
            archive_path = Path(temp_dir) / f"{backup_name}.tar.gz"
            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(backup_path, arcname=backup_name)
            
            print(f"📁 Backup created: {archive_path} ({archive_path.stat().st_size // 1024}KB)")
            return archive_path, backup_info

    def get_or_create_backup_folder(self):
        """Get or create the backup folder in Google Drive"""
        if not self.service:
            return None
        
        try:
            # Search for existing backup folder
            results = self.service.files().list(
                q="name='time-management-backups' and mimeType='application/vnd.google-apps.folder'",
                fields="files(id, name)"
            ).execute()
            
            if results.get('files'):
                folder_id = results['files'][0]['id']
                print(f"📁 Using existing backup folder: {folder_id}")
                return folder_id
            
            # Create new backup folder
            folder_metadata = {
                'name': 'time-management-backups',
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            folder = self.service.files().create(
                body=folder_metadata,
                fields='id'
            ).execute()
            
            folder_id = folder.get('id')
            print(f"📁 Created backup folder: {folder_id}")
            return folder_id
            
        except Exception as e:
            print(f"❌ Error managing backup folder: {e}")
            return None

    def upload_to_gdrive(self, file_path, backup_info):
        """Upload backup file to Google Drive"""
        if not self.service:
            print("⚠️  Google Drive not available - skipping upload")
            return False
        
        folder_id = self.get_or_create_backup_folder()
        if not folder_id:
            return False
        
        try:
            file_name = file_path.name
            
            file_metadata = {
                'name': file_name,
                'parents': [folder_id],
                'description': f"Time Management App backup from {backup_info['timestamp']}"
            }
            
            media = MediaFileUpload(str(file_path), resumable=True)
            
            print("☁️  Uploading to Google Drive...")
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,name,size'
            ).execute()
            
            print(f"✅ Uploaded: {file.get('name')} ({int(file.get('size', 0)) // 1024}KB)")
            return True
            
        except Exception as e:
            print(f"❌ Upload failed: {e}")
            return False

    def cleanup_old_backups(self):
        """Remove backups older than retention period"""
        if not self.service:
            return
        
        folder_id = self.get_or_create_backup_folder()
        if not folder_id:
            return
        
        try:
            cutoff_date = (datetime.now() - timedelta(days=self.retention_days)).isoformat()
            
            # Find old backup files
            results = self.service.files().list(
                q=f"parents in '{folder_id}' and name contains 'time-management-backup-' and createdTime < '{cutoff_date}'",
                fields="files(id, name, createdTime)"
            ).execute()
            
            old_files = results.get('files', [])
            
            if old_files:
                print(f"🧹 Cleaning up {len(old_files)} old backups...")
                
                for file in old_files:
                    try:
                        self.service.files().delete(fileId=file['id']).execute()
                        print(f"🗑️  Deleted: {file['name']}")
                    except Exception as e:
                        print(f"❌ Could not delete {file['name']}: {e}")
            else:
                print("✅ No old backups to clean up")
                
        except Exception as e:
            print(f"❌ Cleanup failed: {e}")

    def run_backup(self, data_dir="/mnt/time-management-data/data"):
        """Run complete backup process"""
        print("🔄 Starting Google Drive backup...")
        
        try:
            # Create backup package
            archive_path, backup_info = self.create_backup_package(data_dir)
            
            # Upload to Google Drive
            upload_success = self.upload_to_gdrive(archive_path, backup_info)
            
            # Cleanup old backups
            if upload_success:
                self.cleanup_old_backups()
            
            print("✅ Backup process completed!")
            return True
            
        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return False

def main():
    import sys
    
    # Get service account file from argument or environment
    service_account_file = None
    if len(sys.argv) > 1:
        service_account_file = sys.argv[1]
    else:
        service_account_file = os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE')
    
    if not service_account_file:
        print("❌ No Google service account file specified")
        print("Usage: python3 gdrive-backup.py <service-account-file>")
        print("Or set GOOGLE_SERVICE_ACCOUNT_FILE environment variable")
        return False
    
    backup = GDriveBackup(service_account_file)
    return backup.run_backup()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)