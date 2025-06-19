const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class HistoricalDataManager {
    constructor(dataDir = null) {
        // Use provided data directory or default to local
        const baseDir = dataDir || path.join(__dirname, '..', 'data');

        this.eventsFile = path.join(baseDir, 'events.json');
        this.snapshotsDir = path.join(baseDir, 'snapshots');
        this.schemaFile = path.join(baseDir, 'schema.json');
        this.currentVersion = '1.0.0';
        this.dataDir = baseDir;
    }

    /**
     * Initialize the historical data system
     */
    async init() {
        await this.ensureDirectories();
        await this.ensureFiles();
    }

    /**
     * Ensure all required directories exist
     */
    async ensureDirectories() {
        try {
            // Ensure base data directory exists first
            await fs.mkdir(this.dataDir, { recursive: true });

            // Then ensure snapshots subdirectory
            await fs.access(this.snapshotsDir);
        } catch (error) {
            await fs.mkdir(this.snapshotsDir, { recursive: true });
        }
    }

    /**
     * Ensure all required files exist
     */
    async ensureFiles() {
        try {
            await fs.access(this.eventsFile);
        } catch (error) {
            await fs.writeFile(this.eventsFile, '[]', 'utf8');
        }
    }

    /**
     * Log an event to the historical data
     * @param {string} type - Event type (e.g., 'task_created', 'task_updated', 'task_deleted')
     * @param {object} data - Event data
     * @param {object} metadata - Additional metadata
     */
    async logEvent(type, data, metadata = {}) {
        const event = {
            id: this.generateEventId(),
            type,
            timestamp: new Date().toISOString(),
            data,
            version: this.currentVersion,
            metadata: {
                userAgent: metadata.userAgent || 'unknown',
                ip: metadata.ip || 'unknown',
                sessionId: metadata.sessionId || 'unknown',
                ...metadata
            }
        };

        try {
            const events = await this.readEvents();
            events.push(event);
            await fs.writeFile(this.eventsFile, JSON.stringify(events, null, 2), 'utf8');

            // Create daily snapshot if needed
            await this.createDailySnapshotIfNeeded();

            return event;
        } catch (error) {
            console.error('Error logging event:', error);
            throw error;
        }
    }

    /**
     * Read all events from the events file
     */
    async readEvents() {
        try {
            const data = await fs.readFile(this.eventsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading events:', error);
            return [];
        }
    }

    /**
     * Get events by type
     * @param {string} type - Event type to filter by
     * @param {Date} startDate - Optional start date filter
     * @param {Date} endDate - Optional end date filter
     */
    async getEventsByType(type, startDate = null, endDate = null) {
        const events = await this.readEvents();

        return events.filter(event => {
            if (event.type !== type) return false;

            if (startDate && new Date(event.timestamp) < startDate) return false;
            if (endDate && new Date(event.timestamp) > endDate) return false;

            return true;
        });
    }

    /**
     * Get events within a date range
     * @param {Date} startDate
     * @param {Date} endDate
     */
    async getEventsByDateRange(startDate, endDate) {
        const events = await this.readEvents();

        return events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startDate && eventDate <= endDate;
        });
    }

    /**
     * Create a snapshot of current data state
     * @param {object} currentData - Current data to snapshot
     * @param {string} reason - Reason for creating snapshot
     */
    async createSnapshot(currentData, reason = 'manual') {
        const snapshot = {
            id: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: this.currentVersion,
            reason,
            data: currentData,
            checksum: this.calculateChecksum(currentData)
        };

        const filename = `snapshot_${new Date().toISOString().split('T')[0]}_${snapshot.id}.json`;
        const filepath = path.join(this.snapshotsDir, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2), 'utf8');
            return snapshot;
        } catch (error) {
            console.error('Error creating snapshot:', error);
            throw error;
        }
    }

    /**
     * Create daily snapshot if one doesn't exist for today
     */
    async createDailySnapshotIfNeeded() {
        const today = new Date().toISOString().split('T')[0];
        const snapshotFiles = await this.getSnapshotFiles();

        const todaySnapshot = snapshotFiles.find(file => file.includes(today));

        if (!todaySnapshot) {
            // Read current tasks to create snapshot
            try {
                const tasksFile = path.join(__dirname, '..', 'data', 'tasks.json');
                const tasksData = await fs.readFile(tasksFile, 'utf8');
                const tasks = JSON.parse(tasksData);

                await this.createSnapshot({ tasks }, 'daily_auto');
            } catch (error) {
                console.error('Error creating daily snapshot:', error);
            }
        }
    }

    /**
     * Get list of snapshot files
     */
    async getSnapshotFiles() {
        try {
            const files = await fs.readdir(this.snapshotsDir);
            return files.filter(file => file.startsWith('snapshot_') && file.endsWith('.json'));
        } catch (error) {
            console.error('Error reading snapshots directory:', error);
            return [];
        }
    }

    /**
     * Read a specific snapshot
     * @param {string} snapshotId
     */
    async readSnapshot(snapshotId) {
        const files = await this.getSnapshotFiles();
        const snapshotFile = files.find(file => file.includes(snapshotId));

        if (!snapshotFile) {
            throw new Error(`Snapshot ${snapshotId} not found`);
        }

        const filepath = path.join(this.snapshotsDir, snapshotFile);
        const data = await fs.readFile(filepath, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Export data for analysis
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Array} eventTypes - Optional filter for event types
     */
    async exportForAnalysis(startDate = null, endDate = null, eventTypes = null) {
        const events = await this.readEvents();

        let filteredEvents = events;

        if (startDate || endDate) {
            filteredEvents = filteredEvents.filter(event => {
                const eventDate = new Date(event.timestamp);
                if (startDate && eventDate < startDate) return false;
                if (endDate && eventDate > endDate) return false;
                return true;
            });
        }

        if (eventTypes && eventTypes.length > 0) {
            filteredEvents = filteredEvents.filter(event => eventTypes.includes(event.type));
        }

        // Generate analytics
        const analytics = this.generateAnalytics(filteredEvents);

        return {
            metadata: {
                exportedAt: new Date().toISOString(),
                totalEvents: filteredEvents.length,
                dateRange: {
                    start: startDate ? startDate.toISOString() : 'all',
                    end: endDate ? endDate.toISOString() : 'all'
                },
                eventTypes: eventTypes || 'all'
            },
            events: filteredEvents,
            analytics
        };
    }

    /**
     * Generate analytics from events
     * @param {Array} events
     */
    generateAnalytics(events) {
        const analytics = {
            eventTypeCounts: {},
            dailyActivity: {},
            taskCompletionStats: {
                totalCreated: 0,
                totalCompleted: 0,
                averageCompletionTime: 0
            },
            productivityTrends: []
        };

        // Count events by type
        events.forEach(event => {
            analytics.eventTypeCounts[event.type] = (analytics.eventTypeCounts[event.type] || 0) + 1;

            // Daily activity
            const date = event.timestamp.split('T')[0];
            analytics.dailyActivity[date] = (analytics.dailyActivity[date] || 0) + 1;
        });

        // Calculate task completion stats
        const taskCreated = events.filter(e => e.type === 'task_created');
        const taskCompleted = events.filter(e => e.type === 'task_completed');

        analytics.taskCompletionStats.totalCreated = taskCreated.length;
        analytics.taskCompletionStats.totalCompleted = taskCompleted.length;

        // Add shopping list analytics
        analytics.shoppingStats = {
            totalCreated: events.filter(e => e.type === 'shopping_item_created').length,
            totalPurchased: events.filter(e => e.type === 'shopping_item_purchased').length,
            totalDeleted: events.filter(e => e.type === 'shopping_item_deleted').length
        };

        // Calculate average completion time
        if (taskCompleted.length > 0) {
            const completionTimes = [];
            taskCompleted.forEach(completedEvent => {
                const taskId = completedEvent.data.id;
                const createdEvent = taskCreated.find(e => e.data.id === taskId);
                if (createdEvent) {
                    const completionTime = new Date(completedEvent.timestamp) - new Date(createdEvent.timestamp);
                    completionTimes.push(completionTime);
                }
            });

            if (completionTimes.length > 0) {
                analytics.taskCompletionStats.averageCompletionTime =
                    completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
            }
        }

        return analytics;
    }

    /**
     * Migrate data structure
     * @param {string} fromVersion
     * @param {string} toVersion
     * @param {Function} migrationFunction
     */
    async migrateData(fromVersion, toVersion, migrationFunction) {
        // Create backup before migration
        const currentData = await this.readCurrentData();
        await this.createSnapshot(currentData, `migration_backup_${fromVersion}_to_${toVersion}`);

        // Log migration event
        await this.logEvent('data_migration', {
            fromVersion,
            toVersion,
            timestamp: new Date().toISOString()
        });

        // Run migration
        try {
            await migrationFunction();

            // Update version
            this.currentVersion = toVersion;

            await this.logEvent('data_migration_completed', {
                fromVersion,
                toVersion,
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            await this.logEvent('data_migration_failed', {
                fromVersion,
                toVersion,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            throw error;
        }
    }

    /**
     * Read current data state
     */
    async readCurrentData() {
        try {
            const tasksFile = path.join(this.dataDir, 'tasks.json');
            const tasksData = await fs.readFile(tasksFile, 'utf8');
            return {
                tasks: JSON.parse(tasksData),
                version: this.currentVersion
            };
        } catch (error) {
            console.error('Error reading current data:', error);
            return { tasks: [], version: this.currentVersion };
        }
    }

    /**
     * Generate unique event ID
     */
    generateEventId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Calculate checksum for data integrity
     * @param {object} data
     */
    calculateChecksum(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
}

module.exports = HistoricalDataManager;
