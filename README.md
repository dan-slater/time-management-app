# Personal Time Management App

A simple, file-based task management web application for personal use.

## Features

- Add, edit, and delete tasks
- Mark tasks as complete/incomplete
- Filter tasks by status (All, Pending, Completed)
- Task statistics
- Data stored in flat files for Git-based backup
- Mobile-responsive design

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:8000`

3. Start managing your tasks!

## Data Storage

Tasks are stored in:
- Browser localStorage for immediate use
- `data/tasks.json` for file-based backup
- All data can be committed to Git for version control

## Future Enhancements

- Email integration
- Calendar synchronization
- Mobile notifications
- Project categorization
- Time tracking
- Recurring tasks