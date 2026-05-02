const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const { jwtkey } = require('../../keys');
const boothAdminRoutes = require('../../routes/boothAdminRoutes');
const { Election, PollingBooth } = require('../../models');

const testApp = express();
testApp.use(bodyParser.json());
testApp.use(boothAdminRoutes);

describe('Booth Admin Routes', () => {
  let testOrg;
  let orgToken;
  let boothElectionId;
  let createdOfficerId;
  let createdBoothId;

  beforeAll(async () => {
    jest.setTimeout(30000);
    await beforeAllHook();

    const { org, token } = await createTestOrg({ name: 'Booth Admin Org', email: 'boothadmin@test.com' });
    testOrg = org;
    orgToken = token;

    // Booth-mode election
    const boothElection = await new Election({
      org_id: testOrg._id,
      election_id: 1,
      election_name: 'Booth Elec',
      election_type: 'fptp',
      mode: 'booth',
      status: 'draft',
    }).save();
    boothElectionId = boothElection.election_id;

    // Online-mode election (to test rejection)
    await new Election({
      org_id: testOrg._id,
      election_id: 2,
      election_name: 'Online Elec',
      election_type: 'fptp',
      mode: 'online',
      status: 'draft',
    }).save();

    // Closed booth election (to test rejection)
    await new Election({
      org_id: testOrg._id,
      election_id: 3,
      election_name: 'Closed Booth Elec',
      election_type: 'fptp',
      mode: 'booth',
      status: 'closed',
    }).save();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  // ── Auth guard ────────────────────────────────────────────────────────────

  it('POST /api/officers — 401 without org token', async () => {
    const res = await request(testApp)
      .post('/api/officers')
      .send({ name: 'X', email: 'x@t.com', password: 'p' });
    expect(res.status).toBe(401);
  });

  // ── POST /api/officers ────────────────────────────────────────────────────

  it('POST /api/officers — 400 when fields are missing', async () => {
    const res = await request(testApp)
      .post('/api/officers')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Officer A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('POST /api/officers — 201 creates officer', async () => {
    const res = await request(testApp)
      .post('/api/officers')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Officer A', email: 'officera@test.com', password: 'Pass1234!' });
    expect(res.status).toBe(201);
    expect(res.body.officer.name).toBe('Officer A');
    createdOfficerId = res.body.officer.id;
  });

  it('POST /api/officers — 409 for duplicate email within org', async () => {
    const res = await request(testApp)
      .post('/api/officers')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Officer A Dup', email: 'officera@test.com', password: 'Pass1234!' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  // ── GET /api/officers ─────────────────────────────────────────────────────

  it('GET /api/officers — returns officer list', async () => {
    const res = await request(testApp)
      .get('/api/officers')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.officers)).toBe(true);
    expect(res.body.officers.length).toBe(1);
    expect(res.body.officers[0].name).toBe('Officer A');
  });

  // ── POST /api/elections/:id/booths ────────────────────────────────────────

  it('POST /api/elections/:id/booths — 400 when name is missing', async () => {
    const res = await request(testApp)
      .post(`/api/elections/${boothElectionId}/booths`)
      .set('Authorization', `Bearer ${orgToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/booth name required/i);
  });

  it('POST /api/elections/:id/booths — 404 for non-existent election', async () => {
    const res = await request(testApp)
      .post('/api/elections/9999/booths')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Booth X' });
    expect(res.status).toBe(404);
  });

  it('POST /api/elections/:id/booths — 400 for online-mode election', async () => {
    const res = await request(testApp)
      .post('/api/elections/2/booths')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Should Fail' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a booth election/i);
  });

  it('POST /api/elections/:id/booths — 400 for closed election', async () => {
    const res = await request(testApp)
      .post('/api/elections/3/booths')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Should Fail' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/closed/i);
  });

  it('POST /api/elections/:id/booths — 201 creates booth with activation code', async () => {
    const res = await request(testApp)
      .post(`/api/elections/${boothElectionId}/booths`)
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ name: 'Main Hall Booth' });
    expect(res.status).toBe(201);
    expect(res.body.booth.name).toBe('Main Hall Booth');
    expect(res.body.booth).toHaveProperty('activation_code');
    expect(res.body.booth.activation_code).toHaveLength(12);
    expect(res.body.booth.is_active).toBe(false);
    createdBoothId = res.body.booth.id;
  });

  // ── GET /api/elections/:id/booths ─────────────────────────────────────────

  it('GET /api/elections/:id/booths — returns booth list', async () => {
    const res = await request(testApp)
      .get(`/api/elections/${boothElectionId}/booths`)
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.booths)).toBe(true);
    expect(res.body.booths.length).toBe(1);
    expect(res.body.booths[0].name).toBe('Main Hall Booth');
  });

  // ── POST /api/elections/:id/booths/:booth_id/deactivate ───────────────────

  it('POST /api/elections/:id/booths/:id/deactivate — 404 for unknown booth', async () => {
    const res = await request(testApp)
      .post(`/api/elections/${boothElectionId}/booths/000000000000000000000001/deactivate`)
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/elections/:id/booths/:id/deactivate — 200 deactivates booth', async () => {
    // Activate the booth first so we can verify the deactivate path clears session
    await PollingBooth.findByIdAndUpdate(createdBoothId, {
      is_active: true,
      session_token: 'some-session-token',
    });

    const res = await request(testApp)
      .post(`/api/elections/${boothElectionId}/booths/${createdBoothId}/deactivate`)
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);

    // Verify DB state
    const booth = await PollingBooth.findById(createdBoothId);
    expect(booth.is_active).toBe(false);
    expect(booth.session_token).toBeNull();
  });

  // ── DELETE /api/officers/:id ──────────────────────────────────────────────

  it('DELETE /api/officers/:id — 404 for unknown officer', async () => {
    const res = await request(testApp)
      .delete('/api/officers/000000000000000000000001')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /api/officers/:id — 200 removes officer', async () => {
    const res = await request(testApp)
      .delete(`/api/officers/${createdOfficerId}`)
      .set('Authorization', `Bearer ${orgToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);

    // Verify deletion
    const listRes = await request(testApp)
      .get('/api/officers')
      .set('Authorization', `Bearer ${orgToken}`);
    expect(listRes.body.officers.length).toBe(0);
  });
});
