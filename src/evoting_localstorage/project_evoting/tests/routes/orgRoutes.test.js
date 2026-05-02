const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const orgRoutes = require('../../routes/orgRoutes');
const { beforeAllHook, afterAllHook, createTestOrg, getTestOrgToken } = require('../setup');

const testApp = express();
testApp.use(bodyParser.json());
testApp.use(orgRoutes);

describe('Organization Routes', () => {
  let seededOrg;
  let seededPassword;

  jest.setTimeout(20000);

  beforeAll(async () => {
    await beforeAllHook();
    // Seed an org for login and /me tests
    const { org, plainPassword } = await createTestOrg();
    seededOrg = org;
    seededPassword = plainPassword;
  });

  afterAll(async () => {
    await afterAllHook();
  });

  const testOrgData = {
    name: 'New Org',
    slug: 'new-org',
    email: 'new@example.com',
    password: 'password123'
  };

  it('POST /org/register — sends OTP and returns message', async () => {
    const res = await request(testApp)
      .post('/org/register')
      .send(testOrgData);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/OTP sent/i);
  });

  it('POST /org/verify-otp — returns 400 for invalid OTP', async () => {
    const res = await request(testApp)
      .post('/org/verify-otp')
      .send({ email: testOrgData.email, otp: '000000' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid otp/i);
  });

  it('POST /org/verify-otp — creates org and returns token for valid OTP', async () => {
    const crypto = require('crypto');
    const { OtpVerification } = require('../../models');
    const email = 'otp-happy@test.com';
    const knownOtp = '123456';
    const knownHash = crypto.createHash('sha256').update(knownOtp).digest('hex');

    // Trigger OTP creation
    await request(testApp)
      .post('/org/register')
      .send({ ...testOrgData, email });

    // Manually set known OTP
    await OtpVerification.findOneAndUpdate({ email }, { otpHash: knownHash });

    const res = await request(testApp)
      .post('/org/verify-otp')
      .send({ email, otp: knownOtp });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.org.name).toBe(testOrgData.name);
  });

  it('POST /org/register — returns 400 for missing password', async () => {
    const { password, ...incompleteData } = testOrgData;
    const res = await request(testApp)
      .post('/org/register')
      .send({ ...incompleteData, email: 'another@example.com', slug: 'another-slug' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /org/login — returns token for correct credentials', async () => {
    const res = await request(testApp)
      .post('/org/login')
      .send({
        email: seededOrg.email,
        password: seededPassword
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /org/login — returns 401 for wrong password', async () => {
    const res = await request(testApp)
      .post('/org/login')
      .send({
        email: seededOrg.email,
        password: 'wrongpassword'
      });
    
    expect(res.status).toBe(401);
  });

  it('GET /org/me — returns org for valid token', async () => {
    const token = getTestOrgToken(seededOrg);

    const res = await request(testApp)
      .get('/org/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(seededOrg.email);
    expect(res.body).toHaveProperty('name');
  });

  it('GET /org/me — returns 401 with no token', async () => {
    const res = await request(testApp).get('/org/me');
    expect(res.status).toBe(401);
  });
});
