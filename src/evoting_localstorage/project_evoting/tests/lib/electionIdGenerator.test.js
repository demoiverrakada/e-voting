const { generateElectionId } = require('../../lib/electionIdGenerator');
const { Election } = require('../../models');
const { beforeAllHook, afterAllHook } = require('../setup');
const mongoose = require('mongoose');

describe('electionIdGenerator', () => {
  beforeAll(async () => {
    await beforeAllHook();
  });

  afterAll(async () => {
    await afterAllHook();
  });

  test('returns 1 if no elections exist for org', async () => {
    const org_id = new mongoose.Types.ObjectId();
    const id = await generateElectionId(org_id);
    expect(id).toBe(1);
  });

  test('returns max + 1 if elections exist', async () => {
    const org_id = new mongoose.Types.ObjectId();
    await Election.create({ org_id, election_id: 1, election_name: 'E1', election_type: 'fptp' });
    await Election.create({ org_id, election_id: 5, election_name: 'E2', election_type: 'fptp' });
    
    const id = await generateElectionId(org_id);
    expect(id).toBe(6);
  });

  test('sequences are independent per org', async () => {
    const org_a = new mongoose.Types.ObjectId();
    const org_b = new mongoose.Types.ObjectId();
    
    await Election.create({ org_id: org_a, election_id: 10, election_name: 'A1', election_type: 'fptp' });
    
    expect(await generateElectionId(org_a)).toBe(11);
    expect(await generateElectionId(org_b)).toBe(1);
  });
});
