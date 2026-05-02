const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { beforeAllHook, afterAllHook, createTestOrg, getTestOrgToken } = require('./setup');
const { Organization } = require('../models');

// Mock Razorpay
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 99900,
        currency: 'INR',
      }),
    },
  }));
});

// Setting env vars for Razorpay initialization in routes
process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET = 'placeholder_secret';

const billingRoutes = require('../routes/billingRoutes');
const testApp = express();
testApp.use(bodyParser.json());
testApp.use('/billing', billingRoutes);

describe('Billing API', () => {
  let token;
  let org;

  beforeAll(async () => {
    await beforeAllHook();
    const seeded = await createTestOrg();
    org = seeded.org;
    token = getTestOrgToken(org);
  });

  afterAll(async () => {
    await afterAllHook();
  });

  test('GET /billing/status returns free plan by default', async () => {
    const res = await request(testApp)
      .get('/billing/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('free');
    expect(res.body.elections_created).toBe(0);
  });

  test('GET /billing/status returns 401 without token', async () => {
    const res = await request(testApp).get('/billing/status');
    expect(res.status).toBe(401);
  });

  test('POST /billing/create-order — returns 400 if org already on paid plan', async () => {
    await Organization.findByIdAndUpdate(org._id, { plan: 'paid' });
    const res = await request(testApp)
      .post('/billing/create-order')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already on paid plan/i);
    
    // Reset back to free for next test
    await Organization.findByIdAndUpdate(org._id, { plan: 'free' });
  });

  test('POST /billing/create-order — returns order details for free plan org', async () => {
    const res = await request(testApp)
      .post('/billing/create-order')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.order_id).toBe('order_test123');
    expect(res.body.amount).toBe(99900);
  });

  test('POST /billing/verify returns 400 for missing fields', async () => {
    const res = await request(testApp)
      .post('/billing/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing/i);
  });

  test('POST /billing/verify returns 400 for invalid signature', async () => {
    const res = await request(testApp)
      .post('/billing/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: 'order_fake123',
        razorpay_payment_id: 'pay_fake456',
        razorpay_signature: 'badsignature',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/signature/i);
  });
});
