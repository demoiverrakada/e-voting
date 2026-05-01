const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { beforeAllHook, afterAllHook, createTestOrg } = require('../setup');
const { jwtkey } = require('../../keys');
const electionRoutes = require('../../routes/electionRoutes');
const { Election, Candidate, Voter } = require('../../models');

const testApp = express();
testApp.use(bodyParser.json());
testApp.use(electionRoutes);

describe('Election Management API', () => {
  let token;
  let testOrg;

  beforeAll(async () => {
    jest.setTimeout(20000);
    await beforeAllHook();
    const { org } = await createTestOrg();
    testOrg = org;
    token = jwt.sign({ orgId: org._id }, jwtkey, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await afterAllHook();
  });

  test('POST /api/elections — creates election and returns 201', async () => {
    const res = await request(testApp)
      .post('/api/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({ election_name: 'Test Election', election_type: 'fptp' });

    expect(res.status).toBe(201);
    expect(res.body.election_id).toBe(1);
    expect(res.body.election_name).toBe('Test Election');
    expect(res.body.status).toBe('draft');
  });

  test('POST /api/elections — second election gets election_id 2', async () => {
    const res = await request(testApp)
      .post('/api/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({ election_name: 'Second Election', election_type: 'preferential' });

    expect(res.status).toBe(201);
    expect(res.body.election_id).toBe(2);
  });

  test('GET /api/elections — returns list of elections for org', async () => {
    const res = await request(testApp)
      .get('/api/elections')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test('PATCH /api/elections/:id — updates election name', async () => {
    const res = await request(testApp)
      .patch('/api/elections/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ election_name: 'Updated Election Name' });

    expect(res.status).toBe(200);
    expect(res.body.election_name).toBe('Updated Election Name');
  });

  test('POST /api/elections/:id/candidates — adds candidates', async () => {
    const res = await request(testApp)
      .post('/api/elections/1/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send([
        { name: 'Alice', entry_number: '1', cand_id: 'alice' },
        { name: 'Bob', entry_number: '2', cand_id: 'bob' }
      ]);

    expect(res.status).toBe(200);
    expect(res.body.added).toBe(2);
  });

  test('POST /api/elections/:id/voters — adds voters', async () => {
    const res = await request(testApp)
      .post('/api/elections/1/voters')
      .set('Authorization', `Bearer ${token}`)
      .send([
        { name: 'Voter 1', voter_id: 'v1@test.com', email: 'v1@test.com' }
      ]);

    expect(res.status).toBe(200);
    expect(res.body.added).toBe(1);
    expect(res.body.total_voters).toBe(1);
  });

  test('GET /api/elections/:id/voters — does not expose token_id value', async () => {
    const res = await request(testApp)
      .get('/api/elections/1/voters')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].token_id).toBe('pending');
  });

  test('POST /api/elections/:id/open — opens election and returns invites_sent', async () => {
    const res = await request(testApp)
      .post('/api/elections/1/open')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('open');
    expect(res.body.invites_sent).toBe(1);
  });

  test('POST /api/elections/:id/open — fails if already open', async () => {
    const res = await request(testApp)
      .post('/api/elections/1/open')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Election must be in draft status');
  });

  test('POST /api/elections/:id/close — closes election', async () => {
    const res = await request(testApp)
      .post('/api/elections/1/close')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
  });

  test('PATCH /api/elections/:id — fails if election is open or closed', async () => {
    const res = await request(testApp)
      .patch('/api/elections/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ election_name: 'Should Fail' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Cannot edit an election that is already open or closed');
  });

  test('GET /api/elections/:id/summary — returns full summary', async () => {
    const res = await request(testApp)
      .get('/api/elections/1/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.election.election_id).toBe(1);
    expect(res.body.candidates.length).toBe(2);
    expect(res.body.turnout).toBeDefined();
    expect(res.body.turnout.total_voters).toBe(1);
  });
});
