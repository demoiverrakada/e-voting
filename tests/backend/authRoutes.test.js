const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock the database connection
jest.mock('mongoose', () => ({
  createConnection: jest.fn(() => ({
    on: jest.fn(),
    model: jest.fn(),
    db: {
      collection: jest.fn(() => ({
        dropIndex: jest.fn()
      }))
    }
  })),
  Schema: jest.fn(),
  model: jest.fn()
}));

// Mock the User models
const mockUser = {
  findOne: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
};

jest.mock('../models/User', () => ({
  PO: mockUser,
  Votes: mockUser,
  Admin: mockUser,
  Candidate: mockUser,
  Voter: mockUser,
  Receipt: mockUser,
  Bulletin: mockUser,
  Keys: mockUser,
  Dec: mockUser,
  Verf: mockUser,
  VerfP: mockUser
}));

// Mock the keys module
jest.mock('../keys', () => ({
  jwtkey: 'test-jwt-key',
  mongoUrl: 'mongodb://test-url'
}));

// Mock the requireToken middleware
jest.mock('../middelware/requireToken', () => (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
});

// Mock child_process
jest.mock('child_process', () => ({
  spawnSync: jest.fn(() => ({
    error: null,
    stdout: Buffer.from('{"success": true, "data": "test result"}'),
    stderr: Buffer.from('')
  })),
  spawn: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn()
}));

// Mock archiver
jest.mock('archiver', () => {
  const mockArchiver = {
    pipe: jest.fn(),
    append: jest.fn(),
    finalize: jest.fn(),
    on: jest.fn()
  };
  return jest.fn(() => mockArchiver);
});

// Mock os
jest.mock('os', () => ({
  platform: jest.fn(() => 'darwin'),
  tmpdir: jest.fn(() => '/tmp')
}));

// Mock async
jest.mock('async', () => ({
  parallel: jest.fn((tasks, callback) => {
    const results = tasks.map(task => task());
    callback(null, results);
  }),
  series: jest.fn((tasks, callback) => {
    let result;
    for (const task of tasks) {
      result = task();
    }
    callback(null, result);
  })
}));

// Create test app
const app = express();
app.use(express.json());

// Import and use the auth routes
const authRoutes = require('../routes/authRoutes');
app.use('/api', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('should register a new polling officer successfully', async () => {
      mockUser.findOne.mockResolvedValue(null); // No existing user
      mockUser.create.mockResolvedValue({
        _id: 'new-user-id',
        email: 'test@example.com',
        password: 'hashed-password'
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.create).toHaveBeenCalled();
    });

    it('should return error if user already exists', async () => {
      mockUser.findOne.mockResolvedValue({
        _id: 'existing-user-id',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should return error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email');
    });
  });

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = '$2b$10$hashedpassword';
      mockUser.findOne.mockResolvedValue({
        _id: 'user-id',
        email: 'test@example.com',
        password: hashedPassword
      });

      // Mock bcrypt.compare
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      mockUser.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/profile', () => {
    it('should return user profile when authenticated', async () => {
      mockUser.findById.mockResolvedValue({
        _id: 'user-id',
        email: 'test@example.com'
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('logged out');
    });
  });
});