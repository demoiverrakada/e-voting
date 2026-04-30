const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const requireOrgToken = require('../../middleware/requireOrgToken');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const { jwtkey } = require('../../keys');

describe('requireOrgToken middleware', () => {
  let req, res, next;

  beforeAll(async () => {
    await beforeAllHook();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('returns 401 when no authorization header', async () => {
    await requireOrgToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ error: 'You must be logged in.' });
  });

  it('returns 401 for malformed token', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    await requireOrgToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ error: 'You must be logged in.' });
  });

  it('returns 401 for valid JWT but non-existent org', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ orgId: fakeId }, jwtkey, { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    await requireOrgToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ error: 'Organization not found.' });
  });

  it('calls next() and sets req.org for valid token', async () => {
    const { org } = await createTestOrg();
    const token = jwt.sign({ orgId: org._id }, jwtkey, { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    await requireOrgToken(req, res, next);
    expect(req.org).toBeDefined();
    expect(req.org._id.toString()).toBe(org._id.toString());
    expect(next).toHaveBeenCalled();
  });
});
