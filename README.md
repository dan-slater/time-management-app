# Personal Time Management App

A simple, yet powerful personal task management application designed for long-term productivity analysis and data preservation.

![Time Management App](https://img.shields.io/badge/Status-Active-green) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)

## ✨ Features

### Core Functionality
- 📝 **Task Management**: Add, edit, delete, and complete tasks
- 🎯 **Smart Filtering**: View all tasks, pending only, or completed only
- 📊 **Real-time Statistics**: Track total, pending, and completed tasks
- 🌙 **Dark/Light Mode**: Toggle between themes with automatic persistence
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

### Advanced Features
- 📈 **Historical Data Logging**: Every action is recorded for future analysis
- 🔄 **Automatic Snapshots**: Daily backups of your task data
- 📊 **Analytics Dashboard**: Insights into your productivity patterns
- 📤 **Data Export**: Export your data in JSON or CSV format
- 🔧 **Schema Versioning**: Future-proof data structure evolution
- 💾 **Offline Fallback**: Works even when the server is unavailable

## 🚀 Quick Start

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd time-management-app

# Install dependencies
npm install

# Start the application
npm start
```

The app will be available at `http://localhost:3000`

## 📱 Usage

### Basic Task Management
1. **Add Tasks**: Type in the input field and click "Add Task" or press Enter
2. **Complete Tasks**: Check the checkbox next to any task
3. **Filter Tasks**: Use the filter buttons to view different task states
4. **Delete Tasks**: Click the × button to remove tasks
5. **Toggle Theme**: Click the 🌙/☀️ button in the top-right corner

### Analytics & Export
- Visit `/api/history/analytics` for productivity insights
- Use `/api/history/export?format=csv` to download your data
- Check `/api/history/events` to see all logged activities

## 🏗️ Architecture

### Data Storage
```
data/
├── tasks.json          # Current task state
├── events.json         # Historical event log
├── schema.json         # Data structure versioning
└── snapshots/          # Daily automated backups
    └── snapshot_YYYY-MM-DD_*.json
```

### API Endpoints

#### Core Task Management
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task

#### Historical Data & Analytics
- `GET /api/history/events` - Get historical events with optional filtering
- `GET /api/history/analytics` - Generate productivity analytics
- `GET /api/history/export` - Export data (supports JSON/CSV formats)
- `GET /api/history/snapshots` - List all available snapshots
- `POST /api/history/snapshots` - Create a manual snapshot

### Technology Stack
- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript + CSS3
- **Storage**: File-based JSON (Git-friendly)
- **Historical Logging**: Custom event-driven system

## 📊 Analytics Features

The app automatically tracks and analyzes:
- **Task Creation Patterns**: When you're most likely to add tasks
- **Completion Rates**: Percentage of tasks you actually complete
- **Productivity Trends**: Daily, weekly, and monthly patterns
- **Average Completion Time**: How long tasks typically take
- **Usage Patterns**: When and how you use the app

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Customization
- Theme colors can be modified in `css/style.css`
- Event types can be extended in `lib/historical-data.js`
- Analytics calculations can be customized in the same file

## 🛡️ Data Privacy & Security

- **Local Storage**: All data is stored locally on your machine
- **No Cloud Sync**: Your tasks never leave your device
- **Git-Friendly**: Plain JSON files work perfectly with version control
- **Export Control**: You own and control all your data

## 🔄 Data Migration & Versioning

The app includes a built-in migration system that ensures your historical data remains accessible even as the app evolves:

- **Schema Versioning**: Each data structure change is versioned
- **Automatic Migration**: Old data is automatically upgraded
- **Backup Safety**: Automatic backups before any migration
- **Rollback Support**: Can revert to previous data states if needed

## 🚀 CI/CD Pipeline

This project includes a complete CI/CD pipeline with GitHub Actions:

### Continuous Integration
- **Automated Testing**: Runs on Node.js 18.x and 20.x
- **Code Quality**: ESLint checks for code standards
- **Test Coverage**: Jest with coverage reporting
- **Pull Request Checks**: All PRs must pass tests and linting

### Continuous Deployment
- **Automatic Deployment**: Pushes to `master` branch auto-deploy to DigitalOcean
- **Zero-Downtime Deployment**: Uses PM2 for process management
- **Health Checks**: Verifies deployment success
- **Rollback Safety**: Data backups before each deployment

### Setup Instructions
1. See [deployment/digitalocean-setup.md](deployment/digitalocean-setup.md) for server setup
2. Configure GitHub Secrets (see deployment guide)
3. Push to master branch to trigger deployment

### Running CI Locally
```bash
# Run the same checks as CI
npm run ci  # Runs lint + tests with coverage

# Individual commands
npm run lint        # Code quality checks
npm test           # Run tests
npm run test:coverage  # Tests with coverage report
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. **Important**: Update the historical data system if you modify data structures
5. Test your changes locally (`npm run ci`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Always update event logging when adding new features
- Increment schema version for data structure changes
- Add appropriate tests for new functionality
- Update documentation for API changes
- Ensure all CI checks pass before merging

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues page to report bugs or request new features. When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Your operating system and Node.js version
- Any relevant log output

## 🚀 Production Deployment

### DigitalOcean Deployment (Recommended)

The app supports persistent storage for production deployments:

```bash
# Set environment variable for persistent storage
export DATA_PATH="/mnt/your-volume-path"

# Your data survives all deployments! ✅
```

**Important**: Without persistent storage, you'll lose all data on each deployment!

See [deployment/digitalocean-setup.md](deployment/digitalocean-setup.md) for complete setup instructions.

### Local Development vs Production

```bash
# Development (local files)
npm start
# → Data in ./data/ (lost on container restart)

# Production (persistent volume)
DATA_PATH="/mnt/persistent-storage" npm start  
# → Data in /mnt/persistent-storage/data/ (persists forever)
```

## 📈 Roadmap

See [VISION.md](VISION.md) for the long-term vision and planned features.

## 🙏 Acknowledgments

- Built with modern web standards and best practices
- Inspired by the need for long-term personal productivity analysis
- Designed with data preservation and privacy as core principles