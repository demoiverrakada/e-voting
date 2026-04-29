const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Before all tests: start an in-memory MongoDB server and connect mongoose to it.
 */
const beforeAllHook = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  await mongoose.connect(uri);
};

/**
 * After all tests: disconnect and stop the in-memory server.
 */
const afterAllHook = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Helper to create a test organization.
 */
const createTestOrg = async () => {
  const { Organization } = require('../models');
  const plainPassword = 'password123';
  const orgData = {
    name: 'Test Org',
    slug: 'test-org',
    email: 'test@example.com',
    passwordHash: plainPassword,
  };
  const org = new Organization(orgData);
  await org.save();
  return { org, plainPassword };
};

module.exports = {
  beforeAllHook,
  afterAllHook,
  createTestOrg,
};
