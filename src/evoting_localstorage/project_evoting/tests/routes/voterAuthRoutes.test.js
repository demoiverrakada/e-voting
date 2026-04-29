const request = require('supertest');
const express = require('express');
const { Voter } = require('../../models');
const voterAuthRoutes = require('../../routes/voterAuthRoutes');
const { beforeAllHook, afterAllHook } = require('../setup');
const mongoose = require('mongoose');

const testApp = express();
testApp.use(voterAuthRoutes);

describe('Voter Auth Routes', () => {
  beforeAll(async () => {
    await beforeAllHook();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  it('GET /voter/validate-token — returns 400 when no token provided', async () => {
    const res = await request(testApp).get('/voter/validate-token');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Token is required');
  });

  it('GET /voter/validate-token — returns 401 for non-existent token', async () => {
    const res = await request(testApp).get('/voter/validate-token?token=nonexistent');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or already used token');
  });

  it('GET /voter/validate-token — returns 401 for already-voted voter', async () => {
    const voter = new Voter({
      name: 'Voted User',
      voter_id: 'voted@example.com',
      election_id: '123',
      token_id: 'voted-token',
      vote: true,
      org_id: new mongoose.Types.ObjectId()
    });
    await voter.save();

    const res = await request(testApp).get('/voter/validate-token?token=voted-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or already used token');
  });

  it('GET /voter/validate-token — returns valid: true for unused token', async () => {
    const voter = new Voter({
      name: 'Fresh User',
      voter_id: 'fresh@example.com',
      election_id: '123',
      token_id: 'fresh-token',
      vote: false,
      org_id: new mongoose.Types.ObjectId()
    });
    await voter.save();

    const res = await request(testApp).get('/voter/validate-token?token=fresh-token');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.voter.name).toBe('Fresh User');
  });
});
