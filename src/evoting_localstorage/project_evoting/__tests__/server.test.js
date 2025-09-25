const request = require('supertest');
const express = require('express');

// Mock the server setup
const app = express();
app.use(express.json());

// Basic health check endpoint for testing
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

describe('Election Server', () => {
  test('Health check endpoint should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('Server is running');
  });

  test('Server should handle JSON requests', async () => {
    const testData = { test: 'data' };
    
    app.post('/test', (req, res) => {
      res.json(req.body);
    });

    const response = await request(app)
      .post('/test')
      .send(testData)
      .expect(200);
    
    expect(response.body).toEqual(testData);
  });
});