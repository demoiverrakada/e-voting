const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const beforeAllHook = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
  process.env.RAZORPAY_KEY_SECRET = 'placeholder_secret_for_tests';
  await mongoose.connect(uri);
};

const afterAllHook = async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

/**
 * Create a test org. Pass overrides to avoid slug/email collisions
 * when calling multiple times in the same test file.
 * Defaults are kept for backward compatibility with existing tests.
 */
const createTestOrg = async (overrides = {}) => {
  const { Organization } = require('../models');
  const plainPassword = overrides.password || 'testpassword123';
  const name  = overrides.name  || 'Test Org';
  const email = overrides.email || 'test@example.com';
  const slug  = overrides.slug  || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const org = new Organization({ name, slug, email, passwordHash: plainPassword });
  await org.save();
  const jwt = require('jsonwebtoken');
  const { jwtkey } = require('../keys');
  const token = jwt.sign({ orgId: org._id }, jwtkey, { expiresIn: '1h' });
  return { org, token, plainPassword };
};

const getTestOrgToken = (org) => {
  const jwt = require('jsonwebtoken');
  const { jwtkey } = require('../keys');
  return jwt.sign({ orgId: org._id }, jwtkey, { expiresIn: '1h' });
};

module.exports = { beforeAllHook, afterAllHook, createTestOrg, getTestOrgToken };
