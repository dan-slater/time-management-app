const fs = require('fs').promises;
const path = require('path');

/**
 * Database adapter that can switch between file storage and SQL databases
 * This allows gradual migration from files to database
 */
class DatabaseAdapter {
    constructor(config = {}) {
        this.type = config.type || 'file'; // 'file' or 'postgres'
        this.config = config;
        
        if (this.type === 'file') {
            this.tasksFile = path.join(__dirname, '..', 'data', 'tasks.json');
            this.eventsFile = path.join(__dirname, '..', 'data', 'events.json');
        } else if (this.type === 'postgres') {
            // Initialize PostgreSQL connection
            this.initPostgres();
        }
    }

    async initPostgres() {
        // Will implement when needed
        const { Pool } = require('pg');
        this.pool = new Pool({
            connectionString: this.config.databaseUrl,
            ssl: this.config.ssl
        });
        
        // Create tables if they don't exist
        await this.createTables();
    }

    async createTables() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id BIGINT PRIMARY KEY,
                text TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY,
                type VARCHAR(100) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                data JSONB NOT NULL,
                version VARCHAR(20) NOT NULL,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);
            CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp);
        `);
    }

    // Tasks CRUD operations
    async getTasks() {
        if (this.type === 'file') {
            try {
                const data = await fs.readFile(this.tasksFile, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                return [];
            }
        } else {
            const result = await this.pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: parseInt(row.id),
                text: row.text,
                completed: row.completed,
                createdAt: row.created_at,
                completedAt: row.completed_at
            }));
        }
    }

    async createTask(task) {
        if (this.type === 'file') {
            const tasks = await this.getTasks();
            tasks.push(task);
            await fs.writeFile(this.tasksFile, JSON.stringify(tasks, null, 2));
            return task;
        } else {
            const result = await this.pool.query(
                'INSERT INTO tasks (id, text, completed, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
                [task.id, task.text, task.completed, task.createdAt]
            );
            return this.formatTask(result.rows[0]);
        }
    }

    async updateTask(id, updates) {
        if (this.type === 'file') {
            const tasks = await this.getTasks();
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex === -1) return null;
            
            tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
            await fs.writeFile(this.tasksFile, JSON.stringify(tasks, null, 2));
            return tasks[taskIndex];
        } else {
            const setClause = Object.keys(updates)
                .map((key, i) => `${this.camelToSnake(key)} = $${i + 2}`)
                .join(', ');
            
            const values = [id, ...Object.values(updates)];
            const result = await this.pool.query(
                `UPDATE tasks SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
                values
            );
            
            return result.rows.length > 0 ? this.formatTask(result.rows[0]) : null;
        }
    }

    async deleteTask(id) {
        if (this.type === 'file') {
            const tasks = await this.getTasks();
            const task = tasks.find(t => t.id === id);
            const filteredTasks = tasks.filter(t => t.id !== id);
            await fs.writeFile(this.tasksFile, JSON.stringify(filteredTasks, null, 2));
            return task;
        } else {
            const result = await this.pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
            return result.rows.length > 0 ? this.formatTask(result.rows[0]) : null;
        }
    }

    // Events operations
    async logEvent(event) {
        if (this.type === 'file') {
            const events = await this.getEvents();
            events.push(event);
            await fs.writeFile(this.eventsFile, JSON.stringify(events, null, 2));
            return event;
        } else {
            const result = await this.pool.query(
                'INSERT INTO events (id, type, timestamp, data, version, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [event.id, event.type, event.timestamp, event.data, event.version, event.metadata]
            );
            return result.rows[0];
        }
    }

    async getEvents(filters = {}) {
        if (this.type === 'file') {
            try {
                const data = await fs.readFile(this.eventsFile, 'utf8');
                const events = JSON.parse(data);
                
                // Apply filters
                let filtered = events;
                if (filters.type) {
                    filtered = filtered.filter(e => e.type === filters.type);
                }
                if (filters.startDate) {
                    filtered = filtered.filter(e => new Date(e.timestamp) >= filters.startDate);
                }
                if (filters.endDate) {
                    filtered = filtered.filter(e => new Date(e.timestamp) <= filters.endDate);
                }
                
                return filtered;
            } catch (error) {
                return [];
            }
        } else {
            let query = 'SELECT * FROM events WHERE 1=1';
            const params = [];
            
            if (filters.type) {
                query += ' AND type = $' + (params.length + 1);
                params.push(filters.type);
            }
            if (filters.startDate) {
                query += ' AND timestamp >= $' + (params.length + 1);
                params.push(filters.startDate);
            }
            if (filters.endDate) {
                query += ' AND timestamp <= $' + (params.length + 1);
                params.push(filters.endDate);
            }
            
            query += ' ORDER BY timestamp DESC';
            
            const result = await this.pool.query(query, params);
            return result.rows;
        }
    }

    // Utility methods
    formatTask(row) {
        return {
            id: parseInt(row.id),
            text: row.text,
            completed: row.completed,
            createdAt: row.created_at,
            completedAt: row.completed_at
        };
    }

    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    async close() {
        if (this.type === 'postgres' && this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = DatabaseAdapter;