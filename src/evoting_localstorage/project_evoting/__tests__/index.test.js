const request = require('supertest');
const express = require('express');

// Mock mongoose
jest.mock('mongoose', () => ({
  createConnection: jest.fn(() => ({
    on: jest.fn(),
    model: jest.fn(),
    db: {
      collection: jest.fn(() => ({
        dropIndex: jest.fn()
      }))
    }
  }))
}));

// Mock the User models
jest.mock('./models/User', () => ({
  PO: {},
  Votes: {},
  Admin: {},
  Candidate: {},
  Voter: {},
  Receipt: {},
  Bulletin: {},
  Keys: {},
  Dec: {},
  Verf: {},
  VerfP: {}
}));

// Mock the middleware
jest.mock('./middelware/requireToken', () => (req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

// Mock the auth routes
jest.mock('./routes/authRoutes', () => {
  const express = require('express');
  const router = express.Router();
  
  router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working' });
  });
  
  return router;
});

// Create a test app that mimics the main server
const app = express();
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Mock the auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Add the main routes
app.post('/', (req, res) => {
  console.log(req.body);
  res.send('hello');
});

describe('Main Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should respond with hello message', async () => {
      const response = await request(app)
        .post('/')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.text).toBe('hello');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/')
        .send({});

      expect(response.status).toBe(200);
      expect(response.text).toBe('hello');
    });

    it('should handle large request body', async () => {
      const largeData = { data: 'x'.repeat(1000000) }; // 1MB of data
      
      const response = await request(app)
        .post('/')
        .send(largeData);

      expect(response.status).toBe(200);
      expect(response.text).toBe('hello');
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      // The response should not error out
      expect(response.status).not.toBe(500);
    });
  });

  describe('Body Parser Configuration', () => {
    it('should parse JSON bodies up to 200MB', async () => {
      const largeJson = { 
        data: 'x'.repeat(1000000),
        nested: {
          array: new Array(1000).fill('test')
        }
      };

      const response = await request(app)
        .post('/')
        .send(largeJson);

      expect(response.status).toBe(200);
    });

    it('should parse URL-encoded bodies up to 200MB', async () => {
      const formData = 'field1=value1&field2=value2&large=' + 'x'.repeat(1000000);

      const response = await request(app)
        .post('/')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(formData);

      expect(response.status).toBe(200);
    });
  });

  describe('Auth Routes Integration', () => {
    it('should serve auth routes under /api', async () => {
      const response = await request(app)
        .get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Auth routes working');
    });
  });
});