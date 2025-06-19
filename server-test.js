// Test version of server.js that exports the app without starting the server
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const HistoricalDataManager = require('./lib/historical-data');

const app = express();

// Use test data path for tests
const DATA_DIR = process.env.DATA_PATH ?
    path.join(process.env.DATA_PATH, 'data') :
    path.join(__dirname, 'test-data');

const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SHOPPING_FILE = path.join(DATA_DIR, 'shopping.json');
const historicalData = new HistoricalDataManager(DATA_DIR);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure data directory and data files exist
async function ensureDataFiles() {
    try {
        // Ensure data directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Check if tasks file exists
        try {
            await fs.access(TASKS_FILE);
        } catch (error) {
            await fs.writeFile(TASKS_FILE, '[]', 'utf8');
        }

        // Check if shopping file exists
        try {
            await fs.access(SHOPPING_FILE);
        } catch (error) {
            await fs.writeFile(SHOPPING_FILE, '[]', 'utf8');
        }
    } catch (error) {
        console.error('Error ensuring data files:', error);
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

// Read shopping items from file
async function readShoppingItems() {
    try {
        const data = await fs.readFile(SHOPPING_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading shopping items:', error);
        return [];
    }
}

// Write shopping items to file
async function writeShoppingItems(items) {
    try {
        await fs.writeFile(SHOPPING_FILE, JSON.stringify(items, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing shopping items:', error);
        return false;
    }
}

// API Routes - Tasks
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

// Shopping List API Routes
app.get('/api/shopping', async (req, res) => {
    try {
        const items = await readShoppingItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load shopping items' });
    }
});

app.post('/api/shopping', async (req, res) => {
    try {
        const items = await readShoppingItems();
        const newItem = {
            id: Date.now(),
            name: req.body.name,
            quantity: req.body.quantity || 1,
            purchased: false,
            createdAt: new Date().toISOString()
        };
        items.push(newItem);

        const success = await writeShoppingItems(items);
        if (success) {
            await historicalData.logEvent('shopping_item_created', newItem, getRequestMetadata(req));
            res.status(201).json(newItem);
        } else {
            res.status(500).json({ error: 'Failed to save shopping item' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create shopping item' });
    }
});

app.put('/api/shopping/:id', async (req, res) => {
    try {
        const items = await readShoppingItems();
        const itemId = parseInt(req.params.id);
        const itemIndex = items.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Shopping item not found' });
        }

        const oldItem = { ...items[itemIndex] };
        items[itemIndex] = { ...items[itemIndex], ...req.body };
        if (req.body.purchased !== undefined) {
            items[itemIndex].purchasedAt = req.body.purchased ? new Date().toISOString() : null;
        }

        const success = await writeShoppingItems(items);
        if (success) {
            const eventType = req.body.purchased !== undefined ?
                (req.body.purchased ? 'shopping_item_purchased' : 'shopping_item_unpurchased') : 'shopping_item_updated';

            await historicalData.logEvent(eventType, {
                id: itemId,
                oldData: oldItem,
                newData: items[itemIndex],
                changes: req.body
            }, getRequestMetadata(req));

            res.json(items[itemIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update shopping item' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shopping item' });
    }
});

app.delete('/api/shopping/:id', async (req, res) => {
    try {
        const items = await readShoppingItems();
        const itemId = parseInt(req.params.id);
        const itemToDelete = items.find(i => i.id === itemId);
        const filteredItems = items.filter(i => i.id !== itemId);

        if (filteredItems.length === items.length) {
            return res.status(404).json({ error: 'Shopping item not found' });
        }

        const success = await writeShoppingItems(filteredItems);
        if (success) {
            await historicalData.logEvent('shopping_item_deleted', {
                id: itemId,
                deletedItem: itemToDelete
            }, getRequestMetadata(req));

            res.json({ message: 'Shopping item deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete shopping item' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete shopping item' });
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

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check if we can read tasks and shopping items (tests file system access)
        await readTasks();
        await readShoppingItems();

        // Check if historical data system is working
        const events = await historicalData.readEvents();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            dataDir: DATA_DIR,
            tasksCount: (await readTasks()).length,
            shoppingItemsCount: (await readShoppingItems()).length,
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

// Initialize data files and historical system for tests
async function initializeTestApp() {
    await ensureDataFiles();
    await historicalData.init();
}

// Initialize automatically for tests
initializeTestApp().catch(console.error);

module.exports = app;
