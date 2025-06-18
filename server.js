const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_FILE = path.join(__dirname, 'data', 'tasks.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure tasks file exists
async function ensureTasksFile() {
    try {
        await fs.access(TASKS_FILE);
    } catch (error) {
        await fs.writeFile(TASKS_FILE, '[]', 'utf8');
    }
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
        
        tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
        if (req.body.completed !== undefined) {
            tasks[taskIndex].completedAt = req.body.completed ? new Date().toISOString() : null;
        }
        
        const success = await writeTasks(tasks);
        if (success) {
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
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        
        if (filteredTasks.length === tasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const success = await writeTasks(filteredTasks);
        if (success) {
            res.json({ message: 'Task deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Start server
async function startServer() {
    await ensureTasksFile();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();