const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { beforeAllHook, afterAllHook, createTestOrg, getTestOrgToken } = require('./setup');
const billingRoutes = require('../routes/billingRoutes');

process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
process.env.RAZORPAY_KEY_SECRET = 'secret_123';

const testApp = express();
testApp.use(bodyParser.json());
testApp.use('/billing', billingRoutes);

describe('Billing API', () => {
  let token;

  beforeAll(async () => {
    await beforeAllHook();
    const { org } = await createTestOrg();
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
