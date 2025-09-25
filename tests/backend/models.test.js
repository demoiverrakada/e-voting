const mongoose = require('mongoose');

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
  })),
  Schema: jest.fn(() => ({
    pre: jest.fn(),
    methods: {}
  })),
  model: jest.fn()
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn((rounds, callback) => callback(null, 'salt')),
  hash: jest.fn((password, salt, callback) => callback(null, 'hashed-password')),
  compare: jest.fn((password, hash, callback) => callback(null, true))
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'random-string')
  }))
}));

// Mock keys
jest.mock('../keys', () => ({
  mongoUrl: 'mongodb://test-url',
  jwtkey: 'test-jwt-key'
}));

describe('User Models', () => {
  let User;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-require the module to get fresh instances
    delete require.cache[require.resolve('../models/User')];
    User = require('../models/User');
  });

  describe('Polling Officer Model', () => {
    it('should create a polling officer schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });

    it('should have email and password fields', () => {
      const schemaCall = mongoose.Schema.mock.calls[0][0];
      expect(schemaCall.email).toBeDefined();
      expect(schemaCall.password).toBeDefined();
      expect(schemaCall.email.required).toBe(true);
      expect(schemaCall.password.required).toBe(true);
    });
  });

  describe('Voter Model', () => {
    it('should create a voter schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Candidate Model', () => {
    it('should create a candidate schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Vote Model', () => {
    it('should create a vote schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Admin Model', () => {
    it('should create an admin schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Receipt Model', () => {
    it('should create a receipt schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Bulletin Model', () => {
    it('should create a bulletin schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Keys Model', () => {
    it('should create a keys schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Dec Model', () => {
    it('should create a dec schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('Verf Model', () => {
    it('should create a verf schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });

  describe('VerfP Model', () => {
    it('should create a verfp schema', () => {
      expect(mongoose.Schema).toHaveBeenCalled();
    });
  });
});