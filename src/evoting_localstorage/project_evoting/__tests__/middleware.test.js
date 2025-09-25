const jwt = require('jsonwebtoken');

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

// Mock the keys module
jest.mock('../keys', () => ({
  jwtkey: 'test-jwt-key'
}));

describe('RequireToken Middleware', () => {
  let requireToken;
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    requireToken = require('../middelware/requireToken');
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next() when valid token is provided', () => {
    req.headers.authorization = 'Bearer valid-token';
    jwt.verify.mockReturnValue({ id: 'user-id', email: 'test@example.com' });

    requireToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-key');
    expect(req.user).toEqual({ id: 'user-id', email: 'test@example.com' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no authorization header is provided', () => {
    requireToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is malformed', () => {
    req.headers.authorization = 'InvalidFormat';

    requireToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when token is invalid', () => {
    req.headers.authorization = 'Bearer invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    requireToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-jwt-key');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle token without Bearer prefix', () => {
    req.headers.authorization = 'just-token';
    jwt.verify.mockReturnValue({ id: 'user-id', email: 'test@example.com' });

    requireToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('just-token', 'test-jwt-key');
    expect(req.user).toEqual({ id: 'user-id', email: 'test@example.com' });
    expect(next).toHaveBeenCalled();
  });

  it('should handle empty token', () => {
    req.headers.authorization = 'Bearer ';

    requireToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });
});