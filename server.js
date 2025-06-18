const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const HistoricalDataManager = require('./lib/historical-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Use persistent data path for production deployments
const DATA_DIR = process.env.DATA_PATH ? 
    path.join(process.env.DATA_PATH, 'data') : 
    path.join(__dirname, 'data');

const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const historicalData = new HistoricalDataManager(DATA_DIR);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure data directory and tasks file exist
async function ensureTasksFile() {
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Check if tasks file exists
        await fs.access(TASKS_FILE);
    } catch (error) {
        await fs.writeFile(TASKS_FILE, '[]', 'utf8');
    }
}

// Helper function to get request metadata
function getRequestMetadata(req) {
    return {
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        sessionId: req.sessionID || 'no-session'
    };
}

// Read tasks from file
async function readTasks() {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading tasks:', error);
        return [];
    }
}

// Write tasks to file
async function writeTasks(tasks) {
    try {
        await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing tasks:', error);
        return false;
    }
}

// API Routes
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load tasks' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const tasks = await readTasks();
        const newTask = {
            id: Date.now(),
            text: req.body.text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        
        const success = await writeTasks(tasks);
        if (success) {
            // Log historical event
            await historicalData.logEvent('task_created', newTask, getRequestMetadata(req));
            res.status(201).json(newTask);
        } else {
            res.status(500).json({ error: 'Failed to save task' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const tasks = await readTasks();
        const taskId = parseInt(req.params.id);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const oldTask = { ...tasks[taskIndex] };
        tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
        if (req.body.completed !== undefined) {
            tasks[taskIndex].completedAt = req.body.completed ? new Date().toISOString() : null;
        }
        
        const success = await writeTasks(tasks);
        if (success) {
            // Log historical event
            const eventType = req.body.completed !== undefined ? 
                (req.body.completed ? 'task_completed' : 'task_uncompleted') : 'task_updated';
            
            await historicalData.logEvent(eventType, {
                id: taskId,
                oldData: oldTask,
                newData: tasks[taskIndex],
                changes: req.body
            }, getRequestMetadata(req));
            
            res.json(tasks[taskIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update task' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const tasks = await readTasks();
        const taskId = parseInt(req.params.id);
        const taskToDelete = tasks.find(t => t.id === taskId);
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const success = await writeTasks(filteredTasks);
        if (success) {
            // Log historical event
            await historicalData.logEvent('task_deleted', {
                id: taskId,
                deletedTask: taskToDelete
            }, getRequestMetadata(req));
            
            res.json({ message: 'Task deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Historical data endpoints
app.get('/api/history/events', async (req, res) => {
    try {
        const { type, startDate, endDate, limit = 100 } = req.query;
        let events;
        
        if (type) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            events = await historicalData.getEventsByType(type, start, end);
        } else if (startDate && endDate) {
            events = await historicalData.getEventsByDateRange(new Date(startDate), new Date(endDate));
        } else {
            events = await historicalData.readEvents();
        }
        
        // Limit results
        const limitedEvents = events.slice(0, parseInt(limit));
        
        res.json({
            events: limitedEvents,
            total: events.length,
            limit: parseInt(limit)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve historical events' });
    }
});

app.get('/api/history/analytics', async (req, res) => {
    try {
        const { startDate, endDate, eventTypes } = req.query;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const types = eventTypes ? eventTypes.split(',') : null;
        
        const analyticsData = await historicalData.exportForAnalysis(start, end, types);
        res.json(analyticsData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
});

app.get('/api/history/snapshots', async (req, res) => {
    try {
        const snapshotFiles = await historicalData.getSnapshotFiles();
        const snapshots = snapshotFiles.map(file => {
            const parts = file.replace('.json', '').split('_');
            return {
                id: parts[parts.length - 1],
                date: parts[1],
                filename: file
            };
        });
        
        res.json(snapshots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve snapshots' });
    }
});

app.get('/api/history/snapshots/:id', async (req, res) => {
    try {
        const snapshot = await historicalData.readSnapshot(req.params.id);
        res.json(snapshot);
    } catch (error) {
        res.status(404).json({ error: 'Snapshot not found' });
    }
});

app.post('/api/history/snapshots', async (req, res) => {
    try {
        const currentData = await historicalData.readCurrentData();
        const reason = req.body.reason || 'manual';
        const snapshot = await historicalData.createSnapshot(currentData, reason);
        
        await historicalData.logEvent('snapshot_created', {
            snapshotId: snapshot.id,
            reason
        }, getRequestMetadata(req));
        
        res.status(201).json(snapshot);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create snapshot' });
    }
});

app.get('/api/history/export', async (req, res) => {
    try {
        const { startDate, endDate, eventTypes, format = 'json' } = req.query;
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const types = eventTypes ? eventTypes.split(',') : null;
        
        const exportData = await historicalData.exportForAnalysis(start, end, types);
        
        if (format === 'csv') {
            // Convert to CSV format for analysis tools
            const csv = convertToCSV(exportData.events);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="task_history.csv"');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="task_history.json"');
            res.json(exportData);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Helper function to convert events to CSV
function convertToCSV(events) {
    if (!events || events.length === 0) return '';
    
    const headers = ['id', 'type', 'timestamp', 'data', 'version', 'userAgent', 'ip'];
    const csvRows = [headers.join(',')];
    
    events.forEach(event => {
        const row = [
            event.id,
            event.type,
            event.timestamp,
            JSON.stringify(event.data).replace(/"/g, '""'),
            event.version,
            event.metadata?.userAgent || '',
            event.metadata?.ip || ''
        ];
        csvRows.push(row.map(field => `"${field}"`).join(','));
    });
    
    return csvRows.join('\n');
}

// Health check endpoint for DigitalOcean monitoring
app.get('/health', async (req, res) => {
    try {
        // Check if we can read tasks (tests file system access)
        await readTasks();
        
        // Check if historical data system is working
        const events = await historicalData.readEvents();
        
        res.json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            dataDir: DATA_DIR,
            tasksCount: (await readTasks()).length,
            eventsCount: events.length
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
async function startServer() {
    await ensureTasksFile();
    await historicalData.init();
    
    // Log server start event
    await historicalData.logEvent('server_started', {
        port: PORT,
        version: '1.0.0'
    });
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Data directory: ${DATA_DIR}`);
        console.log('Historical data system initialized');
        
        // Log startup info for debugging deployments
        if (process.env.DATA_PATH) {
            console.log(`✅ Using persistent storage: ${process.env.DATA_PATH}`);
        } else {
            console.log(`⚠️  Using local storage - data will be lost on deployment!`);
        }
    });
}

startServer();