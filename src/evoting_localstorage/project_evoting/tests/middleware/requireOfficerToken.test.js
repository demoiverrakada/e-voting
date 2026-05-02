const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const { jwtkey } = require('../../keys');
const requireOfficerToken = require('../../middleware/requireOfficerToken');
const { PollingOfficer } = require('../../models');

const testApp = express();
testApp.use(bodyParser.json());
testApp.get('/protected', requireOfficerToken, (req, res) => res.json({ ok: true, officerId: req.officer._id }));

describe('requireOfficerToken middleware', () => {
  let testOrg;
  let officer;

  beforeAll(async () => {
    jest.setTimeout(20000);
    await beforeAllHook();
    const { org } = await createTestOrg({ name: 'MW Officer Org', email: 'mw-officer@test.com' });
    testOrg = org;

    officer = new PollingOfficer({
      org_id: testOrg._id,
      name: 'MW Officer',
      email: 'mw-officer-person@test.com',
      passwordHash: 'SomePass1!',
    });
    await officer.save();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token required/i);
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer notavalidtoken');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 401 when officer does not exist in DB', async () => {
    const fakeId = '000000000000000000000001';
    const token = jwt.sign({ officerId: fakeId, orgId: testOrg._id }, jwtkey, { expiresIn: '1h' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/officer not found/i);
  });

  it('calls next and sets req.officer for a valid token', async () => {
    const token = jwt.sign({ officerId: officer._id, orgId: testOrg._id }, jwtkey, { expiresIn: '1h' });
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.officerId).toBe(officer._id.toString());
  });
});
