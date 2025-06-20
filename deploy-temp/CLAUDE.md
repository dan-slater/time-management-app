# Time Management App - Claude Instructions

## 🚨 CRITICAL: Historical Data Preservation
**IMPORTANT**: Whenever adding new features or modifying data structures, ALWAYS update the historical data logging system to ensure no data is lost. This includes:
- Adding new event types to `lib/historical-data.js`
- Updating the schema version in `data/schema.json`
- Creating migration functions for data structure changes
- Ensuring all user actions are logged as events
- Testing that analytics and export functionality continues to work

## Project Overview
This is a personal time management web application with a focus on long-term data preservation and analysis. The app maintains comprehensive historical records of all user interactions to enable future analysis and ensure data is never lost, even as the application evolves.

## Key Features
- ✅ Task management (add, edit, delete, complete)
- ✅ Dark/light theme toggle with persistence
- ✅ Real-time task filtering (All, Pending, Completed)
- ✅ Task statistics and analytics
- ✅ Comprehensive historical data logging
- ✅ Automatic daily snapshots
- ✅ Data export (JSON/CSV) for analysis
- ✅ Schema versioning and migration system

## Architecture

### Data Storage
- **Primary**: `data/tasks.json` (current task state)
- **Historical**: `data/events.json` (all user actions logged)
- **Snapshots**: `data/snapshots/` (daily backups)
- **Schema**: `data/schema.json` (data structure versioning)

### Historical Data System
- Every user action is logged as an event with timestamp, user metadata, and version info
- Automatic daily snapshots preserve point-in-time data state
- Built-in migration system handles data structure changes
- Rich analytics and export capabilities for future analysis

## API Endpoints

### Core Task Management
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Historical Data & Analytics
- `GET /api/history/events` - Get historical events (with filtering)
- `GET /api/history/analytics` - Get productivity analytics
- `GET /api/history/export` - Export data (JSON/CSV)
- `GET /api/history/snapshots` - List all snapshots
- `POST /api/history/snapshots` - Create manual snapshot

## Development Guidelines

### When Adding New Features:
1. **Update event logging** - Add new event types for user actions
2. **Schema versioning** - Increment version if data structure changes
3. **Migration planning** - Create migration functions for structural changes
4. **Test historical data** - Ensure logging and analytics still work
5. **Update documentation** - Document new event types and data fields

### Event Types Currently Logged:
- `task_created` - New task added
- `task_completed` - Task marked as complete
- `task_uncompleted` - Task marked as incomplete
- `task_updated` - Task text or properties modified
- `task_deleted` - Task removed
- `server_started` - Application startup
- `snapshot_created` - Manual or automatic backup created

## Technology Stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + CSS
- **Storage**: File-based JSON (Git-friendly)
- **Historical Data**: Custom event logging system

## Running the Application
```bash
npm install
npm start
# App available at http://localhost:3000
```

## Future Analysis Capabilities
The historical data system enables future analysis of:
- Productivity patterns and trends
- Task completion rates and timing
- Usage patterns and habit formation
- Long-term behavior changes
- Data evolution as app features grow