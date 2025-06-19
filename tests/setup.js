const fs = require('fs').promises;
const path = require('path');

// Test database setup
const TEST_DATA_DIR = path.join(__dirname, '..', 'test-data');

// Setup test environment
beforeAll(async () => {
    // Create test data directory with proper structure
    const dataDir = path.join(TEST_DATA_DIR, 'data');
    const snapshotsDir = path.join(dataDir, 'snapshots');
    await fs.mkdir(snapshotsDir, { recursive: true });

    // Create empty data files
    const tasksFile = path.join(dataDir, 'tasks.json');
    const shoppingFile = path.join(dataDir, 'shopping.json');
    const eventsFile = path.join(dataDir, 'events.json');

    await fs.writeFile(tasksFile, '[]', 'utf8');
    await fs.writeFile(shoppingFile, '[]', 'utf8');
    await fs.writeFile(eventsFile, '[]', 'utf8');

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATA_PATH = TEST_DATA_DIR;
});

// Cleanup after each test
afterEach(async () => {
    try {
        // Clean up entire test data directory
        await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
        // Recreate it for next test with proper structure
        const dataDir = path.join(TEST_DATA_DIR, 'data');
        const snapshotsDir = path.join(dataDir, 'snapshots');
        await fs.mkdir(snapshotsDir, { recursive: true });

        // Create empty data files
        const tasksFile = path.join(dataDir, 'tasks.json');
        const shoppingFile = path.join(dataDir, 'shopping.json');
        const eventsFile = path.join(dataDir, 'events.json');

        await fs.writeFile(tasksFile, '[]', 'utf8');
        await fs.writeFile(shoppingFile, '[]', 'utf8');
        await fs.writeFile(eventsFile, '[]', 'utf8');
    } catch (error) {
        console.warn('Cleanup warning:', error.message);
    }
});

// Cleanup after all tests
afterAll(async () => {
    try {
        await fs.rm(TEST_DATA_DIR, { recursive: true });
    } catch (error) {
        console.warn('Final cleanup warning:', error.message);
    }
});
