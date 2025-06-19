const request = require('supertest');
const path = require('path');

// We need to set up test environment before requiring the app
process.env.NODE_ENV = 'test';
process.env.DATA_PATH = path.join(__dirname, '..', 'test-data');

// Import app after setting environment
const app = require('../server-test');

describe('Time Management App API', () => {
    describe('Health Check', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('tasksCount');
            expect(response.body).toHaveProperty('shoppingItemsCount');
        });
    });

    describe('Tasks API', () => {
        test('GET /api/tasks should return empty array initially', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('POST /api/tasks should create a new task', async () => {
            const taskData = { text: 'Test task' };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('text', 'Test task');
            expect(response.body).toHaveProperty('completed', false);
            expect(response.body).toHaveProperty('createdAt');
        });

        test('PUT /api/tasks/:id should update a task', async () => {
            // First create a task
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ text: 'Test task' });

            const taskId = createResponse.body.id;

            // Then update it
            const updateResponse = await request(app)
                .put(`/api/tasks/${taskId}`)
                .send({ completed: true })
                .expect(200);

            expect(updateResponse.body).toHaveProperty('completed', true);
            expect(updateResponse.body).toHaveProperty('completedAt');
        });

        test('DELETE /api/tasks/:id should delete a task', async () => {
            // First create a task
            const createResponse = await request(app)
                .post('/api/tasks')
                .send({ text: 'Test task' });

            const taskId = createResponse.body.id;

            // Then delete it
            await request(app)
                .delete(`/api/tasks/${taskId}`)
                .expect(200);

            // Verify it's gone
            const getResponse = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(getResponse.body.length).toBe(0);
        });

        test('PUT /api/tasks/:id should return 404 for non-existent task', async () => {
            await request(app)
                .put('/api/tasks/999999')
                .send({ completed: true })
                .expect(404);
        });
    });

    describe('Shopping List API', () => {
        test('GET /api/shopping should return empty array initially', async () => {
            const response = await request(app)
                .get('/api/shopping')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        test('POST /api/shopping should create a new shopping item', async () => {
            const itemData = { name: 'Milk', quantity: 2 };

            const response = await request(app)
                .post('/api/shopping')
                .send(itemData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Milk');
            expect(response.body).toHaveProperty('quantity', 2);
            expect(response.body).toHaveProperty('purchased', false);
            expect(response.body).toHaveProperty('createdAt');
        });

        test('PUT /api/shopping/:id should update a shopping item', async () => {
            // First create an item
            const createResponse = await request(app)
                .post('/api/shopping')
                .send({ name: 'Bread', quantity: 1 });

            const itemId = createResponse.body.id;

            // Then update it
            const updateResponse = await request(app)
                .put(`/api/shopping/${itemId}`)
                .send({ purchased: true })
                .expect(200);

            expect(updateResponse.body).toHaveProperty('purchased', true);
            expect(updateResponse.body).toHaveProperty('purchasedAt');
        });

        test('DELETE /api/shopping/:id should delete a shopping item', async () => {
            // First create an item
            const createResponse = await request(app)
                .post('/api/shopping')
                .send({ name: 'Eggs', quantity: 12 });

            const itemId = createResponse.body.id;

            // Then delete it
            await request(app)
                .delete(`/api/shopping/${itemId}`)
                .expect(200);

            // Verify it's gone
            const getResponse = await request(app)
                .get('/api/shopping')
                .expect(200);

            expect(getResponse.body.length).toBe(0);
        });
    });

    describe('Historical Data API', () => {
        test('GET /api/history/events should return events', async () => {
            // Create a task to generate an event
            await request(app)
                .post('/api/tasks')
                .send({ text: 'Test task for history' });

            const response = await request(app)
                .get('/api/history/events')
                .expect(200);

            expect(response.body).toHaveProperty('events');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.events)).toBe(true);
            expect(response.body.events.length).toBeGreaterThan(0);
        });

        test('GET /api/history/analytics should return analytics data', async () => {
            // Create some data to analyze
            await request(app)
                .post('/api/tasks')
                .send({ text: 'Analytics test task' });

            await request(app)
                .post('/api/shopping')
                .send({ name: 'Analytics test item', quantity: 1 });

            const response = await request(app)
                .get('/api/history/analytics')
                .expect(200);

            expect(response.body).toHaveProperty('metadata');
            expect(response.body).toHaveProperty('events');
            expect(response.body).toHaveProperty('analytics');
            expect(response.body.analytics).toHaveProperty('taskCompletionStats');
            expect(response.body.analytics).toHaveProperty('shoppingStats');
        });
    });
});
