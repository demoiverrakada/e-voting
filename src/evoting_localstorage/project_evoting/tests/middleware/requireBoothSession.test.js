const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const requireBoothSession = require('../../middleware/requireBoothSession');
const { PollingBooth } = require('../../models');

const testApp = express();
testApp.use(bodyParser.json());
testApp.get('/booth-only', requireBoothSession, (req, res) => res.json({ ok: true, boothId: req.booth._id }));

describe('requireBoothSession middleware', () => {
  let testOrg;
  let activeBooth;
  const SESSION_TOKEN = 'valid-session-token-abc123';

  beforeAll(async () => {
    jest.setTimeout(20000);
    await beforeAllHook();
    const { org } = await createTestOrg({ name: 'Booth Session Org', email: 'bs-org@test.com' });
    testOrg = org;

    activeBooth = new PollingBooth({
      org_id: testOrg._id,
      election_id: 99,
      name: 'Active Booth',
      activation_code: 'BSMWTEST01',
      session_token: SESSION_TOKEN,
      is_active: true,
    });
    await activeBooth.save();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  it('returns 403 when X-Booth-Session header is absent', async () => {
    const res = await request(testApp).get('/booth-only');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no booth session/i);
  });

  it('returns 403 for an invalid or inactive session token', async () => {
    const res = await request(testApp)
      .get('/booth-only')
      .set('X-Booth-Session', 'completely-wrong-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/invalid or inactive/i);
  });

  it('calls next and sets req.booth for a valid active session', async () => {
    const res = await request(testApp)
      .get('/booth-only')
      .set('X-Booth-Session', SESSION_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.boothId).toBe(activeBooth._id.toString());
  });
});
