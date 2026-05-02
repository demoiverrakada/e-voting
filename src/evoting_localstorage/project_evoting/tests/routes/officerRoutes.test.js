const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const { jwtkey } = require('../../keys');
const officerRoutes = require('../../routes/officerRoutes');
const { PollingOfficer, PollingBooth, Election, Voter } = require('../../models');

const testApp = express();
testApp.use(bodyParser.json());
testApp.use(officerRoutes);

describe('Officer Routes', () => {
  let testOrg;
  let officer;
  let officerToken;
  const OFFICER_PLAIN_PASS = 'OfficerPass1!';
  const ACTIVATION_CODE = 'OFFRTST0001';

  beforeAll(async () => {
    jest.setTimeout(30000);
    await beforeAllHook();

    const { org } = await createTestOrg({ name: 'Officer Route Org', email: 'officer-route@test.com' });
    testOrg = org;

    // Create officer — passwordHash is plain here; pre-save hook hashes it
    officer = new PollingOfficer({
      org_id: testOrg._id,
      name: 'Test Officer',
      email: 'testofficer@test.com',
      passwordHash: OFFICER_PLAIN_PASS,
    });
    await officer.save();

    // Mint a valid JWT for protected-route tests
    officerToken = jwt.sign({ officerId: officer._id, orgId: testOrg._id }, jwtkey, { expiresIn: '12h' });

    // Booth-mode election, status open
    await new Election({
      org_id: testOrg._id,
      election_id: 1,
      election_name: 'Booth Election',
      election_type: 'fptp',
      mode: 'booth',
      status: 'open',
    }).save();

    // A second election (online mode) to test rejection
    await new Election({
      org_id: testOrg._id,
      election_id: 2,
      election_name: 'Online Election',
      election_type: 'fptp',
      mode: 'online',
      status: 'open',
    }).save();

    // Booth attached to election 1
    await new PollingBooth({
      org_id: testOrg._id,
      election_id: 1,
      name: 'Booth A',
      activation_code: ACTIVATION_CODE,
    }).save();

    // Booth attached to online election (should be rejected at activate)
    await new PollingBooth({
      org_id: testOrg._id,
      election_id: 2,
      name: 'Online Booth',
      activation_code: 'ONLINEBOOTH1',
    }).save();

    // A voter in election 1
    await new Voter({
      org_id: testOrg._id,
      election_id: 1,
      voter_id: 'V001',
      name: 'Alice Voter',
      email: 'alice@test.com',
    }).save();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  // ── POST /officer/login ──────────────────────────────────────────────────────

  it('POST /officer/login — 400 when fields are missing', async () => {
    const res = await request(testApp).post('/officer/login').send({ email: 'x@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('POST /officer/login — 401 for unknown email', async () => {
    const res = await request(testApp)
      .post('/officer/login')
      .send({ email: 'nobody@test.com', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('POST /officer/login — 401 for wrong password', async () => {
    const res = await request(testApp)
      .post('/officer/login')
      .send({ email: 'testofficer@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('POST /officer/login — returns token on valid credentials', async () => {
    const res = await request(testApp)
      .post('/officer/login')
      .send({ email: 'testofficer@test.com', password: OFFICER_PLAIN_PASS });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.officer.email).toBe('testofficer@test.com');
    // Refresh token from live login for subsequent tests
    officerToken = res.body.token;
  });

  // ── Auth guard ───────────────────────────────────────────────────────────────

  it('GET /officer/booth/session — 401 with no token', async () => {
    const res = await request(testApp).get('/officer/booth/session');
    expect(res.status).toBe(401);
  });

  // ── GET /officer/booth/session (no active booth yet) ────────────────────────

  it('GET /officer/booth/session — active:false before activation', async () => {
    const res = await request(testApp)
      .get('/officer/booth/session')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  // ── GET /officer/voters (no active booth) ───────────────────────────────────

  it('GET /officer/voters — 400 when no booth is active', async () => {
    const res = await request(testApp)
      .get('/officer/voters')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no active booth/i);
  });

  // ── POST /officer/booth/activate ────────────────────────────────────────────

  it('POST /officer/booth/activate — 400 when activation_code is missing', async () => {
    const res = await request(testApp)
      .post('/officer/booth/activate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/activation_code required/i);
  });

  it('POST /officer/booth/activate — 404 for unknown activation code', async () => {
    const res = await request(testApp)
      .post('/officer/booth/activate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ activation_code: 'DOESNOTEXIST1' });
    expect(res.status).toBe(404);
  });

  it('POST /officer/booth/activate — 400 for online-mode election booth', async () => {
    const res = await request(testApp)
      .post('/officer/booth/activate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ activation_code: 'ONLINEBOOTH1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a booth election/i);
  });

  it('POST /officer/booth/activate — 200 and returns session_token', async () => {
    const res = await request(testApp)
      .post('/officer/booth/activate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ activation_code: ACTIVATION_CODE });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('session_token');
    expect(res.body.booth.election_id).toBe(1);
  });

  it('POST /officer/booth/activate — 400 when booth already active', async () => {
    const res = await request(testApp)
      .post('/officer/booth/activate')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ activation_code: ACTIVATION_CODE });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already active/i);
  });

  // ── GET /officer/booth/session (booth is now active) ────────────────────────

  it('GET /officer/booth/session — active:true after activation', async () => {
    const res = await request(testApp)
      .get('/officer/booth/session')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(true);
    expect(res.body).toHaveProperty('session_token');
    expect(res.body.election.election_id).toBe(1);
  });

  // ── GET /officer/voters ──────────────────────────────────────────────────────

  it('GET /officer/voters — returns voter list for active booth election', async () => {
    const res = await request(testApp)
      .get('/officer/voters')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.voters)).toBe(true);
    expect(res.body.voters.length).toBe(1);
    expect(res.body.voters[0].voter_id).toBe('V001');
  });

  it('GET /officer/voters — search param filters results', async () => {
    const match = await request(testApp)
      .get('/officer/voters?search=alice')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(match.body.voters.length).toBe(1);

    const noMatch = await request(testApp)
      .get('/officer/voters?search=zzznomatch')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(noMatch.body.voters.length).toBe(0);
  });

  // ── POST /officer/voters/:voter_id/verify ───────────────────────────────────

  it('POST /officer/voters/:voter_id/verify — 404 for unknown voter', async () => {
    const res = await request(testApp)
      .post('/officer/voters/VXXX/verify')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/voter not found/i);
  });

  it('POST /officer/voters/:voter_id/verify — 200 and issues token', async () => {
    const res = await request(testApp)
      .post('/officer/voters/V001/verify')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.voter.voter_id).toBe('V001');
    expect(res.body.message).toMatch(/token issued/i);
  });

  it('POST /officer/voters/:voter_id/verify — 409 when token already issued', async () => {
    const res = await request(testApp)
      .post('/officer/voters/V001/verify')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/token already issued/i);
  });

  // ── POST /officer/booth/deactivate ──────────────────────────────────────────

  it('POST /officer/booth/deactivate — 200 and deactivates booth', async () => {
    const res = await request(testApp)
      .post('/officer/booth/deactivate')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('POST /officer/booth/deactivate — 404 when no active booth', async () => {
    const res = await request(testApp)
      .post('/officer/booth/deactivate')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no active booth/i);
  });
});
