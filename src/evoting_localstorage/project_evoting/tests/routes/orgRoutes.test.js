const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const orgRoutes = require('../../routes/orgRoutes');
const { beforeAllHook, afterAllHook } = require('../setup');

const testApp = express();
testApp.use(bodyParser.json());
testApp.use(orgRoutes);

describe('Organization Routes', () => {
  beforeAll(async () => {
    await beforeAllHook();
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

  it('POST /org/register — creates org and returns token', async () => {
    const res = await request(testApp)
      .post('/org/register')
      .send(testOrgData);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.org).toHaveProperty('id');
    expect(res.body.org.email).toBe(testOrgData.email);
  });

  it('POST /org/register — returns 409 for duplicate email', async () => {
    const res = await request(testApp)
      .post('/org/register')
      .send(testOrgData);
    
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
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
        email: testOrgData.email,
        password: testOrgData.password
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /org/login — returns 401 for wrong password', async () => {
    const res = await request(testApp)
      .post('/org/login')
      .send({
        email: testOrgData.email,
        password: 'wrongpassword'
      });
    
    expect(res.status).toBe(401);
  });

  it('GET /org/me — returns org for valid token', async () => {
    const loginRes = await request(testApp)
      .post('/org/login')
      .send({
        email: testOrgData.email,
        password: testOrgData.password
      });
    
    const token = loginRes.body.token;

    const res = await request(testApp)
      .get('/org/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testOrgData.email);
  });

  it('GET /org/me — returns 401 with no token', async () => {
    const res = await request(testApp).get('/org/me');
    expect(res.status).toBe(401);
  });
});
