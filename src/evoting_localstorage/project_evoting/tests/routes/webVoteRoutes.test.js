const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const webVoteRoutes = require('../../routes/webVoteRoutes');
const { Candidate, Organization, Voter, WebVote } = require('../../models');
const { jwtkey } = require('../../keys');
const { beforeAllHook, afterAllHook } = require('../setup');

const testApp = express();
testApp.use(express.json());
testApp.use(webVoteRoutes);

function encryptedVotePayload(token, overrides = {}) {
  return {
    token,
    ballot_type: 'fptp',
    encrypted_vote: {
      algorithm: 'AES-GCM-256',
      iv: 'dGVzdC1pdi0xMjM0',
      ciphertext: 'dGVzdC1jaXBoZXJ0ZXh0',
      key_id: 'browser-local',
    },
    selection_hash: 'a'.repeat(64),
    client_receipt_nonce: 'nonce-123',
    ...overrides,
  };
}

async function createElectionFixture({ token = 'web-token', voted = false, electionType = 'fptp' } = {}) {
  const org = await Organization.create({
    name: 'Web Vote Org',
    slug: `web-vote-org-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: `web-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    passwordHash: 'password123',
  });

  await Candidate.insertMany([
    {
      org_id: org._id,
      election_id: 501,
      election_name: 'Council Election',
      name: 'Asha Rao',
      entry_number: '1',
      cand_id: 'cand-1',
      election_type: electionType,
      number_of_preferences: 2,
    },
    {
      org_id: org._id,
      election_id: 501,
      election_name: 'Council Election',
      name: 'Ben Thomas',
      entry_number: '2',
      cand_id: 'cand-2',
      election_type: electionType,
      number_of_preferences: 2,
    },
  ]);

  const voter = await Voter.create({
    org_id: org._id,
    name: 'Voter One',
    email: 'voter@example.com',
    voter_id: 'voter-1',
    election_id: 501,
    token_id: token,
    vote: voted,
  });

  return { org, voter };
}

describe('Web Vote Routes', () => {
  beforeAll(async () => {
    await beforeAllHook();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  it('GET /api/voter/session returns election and candidates for a valid token', async () => {
    await createElectionFixture({ token: 'session-token' });

    const res = await request(testApp).get('/api/voter/session?token=session-token');

    expect(res.status).toBe(200);
    expect(res.body.election.name).toBe('Council Election');
    expect(res.body.election.type).toBe('fptp');
    expect(res.body.candidates).toHaveLength(2);
    expect(res.body.candidates[0]).toEqual(expect.objectContaining({ cand_id: 'cand-1' }));
  });

  it('GET /api/voter/session rejects missing or already-used tokens', async () => {
    await createElectionFixture({ token: 'used-token', voted: true });

    const missing = await request(testApp).get('/api/voter/session');
    const used = await request(testApp).get('/api/voter/session?token=used-token');

    expect(missing.status).toBe(401);
    expect(used.status).toBe(401);
  });

  it('POST /api/vote/submit stores encrypted vote, marks voter used, and returns receipt', async () => {
    const { voter } = await createElectionFixture({ token: 'submit-token' });

    const res = await request(testApp)
      .post('/api/vote/submit')
      .send(encryptedVotePayload('submit-token'));

    expect(res.status).toBe(201);
    expect(res.body.receipt.id).toBeDefined();
    expect(res.body.receipt.hash).toMatch(/^[a-f0-9]{64}$/);

    const webVote = await WebVote.findOne({ voter_id: voter.voter_id, election_id: voter.election_id });
    expect(webVote.encrypted_vote.ciphertext).toBe('dGVzdC1jaXBoZXJ0ZXh0');

    const updatedVoter = await Voter.findById(voter._id);
    expect(updatedVoter.vote).toBe(true);
  });

  it('POST /api/vote/submit prevents duplicate voting with the same token', async () => {
    await createElectionFixture({ token: 'duplicate-token' });

    const first = await request(testApp)
      .post('/api/vote/submit')
      .send(encryptedVotePayload('duplicate-token'));
    const second = await request(testApp)
      .post('/api/vote/submit')
      .send(encryptedVotePayload('duplicate-token'));

    expect(first.status).toBe(201);
    expect(second.status).toBe(401);
  });

  it('GET /api/web-votes/results returns live encrypted web turnout for org admins', async () => {
    const { org } = await createElectionFixture({ token: 'results-token' });
    await request(testApp).post('/api/vote/submit').send(encryptedVotePayload('results-token'));

    const token = jwt.sign({ orgId: org._id, email: org.email }, jwtkey);
    const res = await request(testApp)
      .get('/api/web-votes/results?election_id=501')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.submitted_web_votes).toBe(1);
    expect(res.body.total_voters).toBe(1);
    expect(res.body.turnout_percent).toBe(100);
  });
});
